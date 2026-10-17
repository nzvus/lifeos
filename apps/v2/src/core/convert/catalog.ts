/**
 * The converter's catalog part (migration.md "Mapping"): ingredients become
 * foods, products and formats (the refined copy's `_v2` layer, ADR-0055, or
 * one food per ingredient without it), with their values; tags, compounds,
 * recipes and their parts, rating factors, exercises, routines, money
 * categories and v1's pantry products.
 */
import Big from "big.js";
import type { Out, RefinedV2, V1Export, V1Row } from "./context";
import { bool, confidenceOf, dec, idFor, iso, num, ref, str, text } from "./context";

/** v1 nutrient column → v2 field. */
export const NUTRIENTS: readonly [string, string][] = [
  ["kcal", "kcal"],
  ["protein", "protein"],
  ["carbs", "carbs"],
  ["sugars", "sugars"],
  ["fat", "fat"],
  ["saturatedFat", "saturatedFat"],
  ["fiber", "fibre"],
  ["salt", "salt"],
];

/** Where an ingredient landed: its food, and its product and format when it was one. */
export type Landed = { food: string; product: string | null; format: string | null };

export type CatalogMaps = {
  ingredient: Map<string, Landed>;
  /** v1 meal id → recipe id (merged meals point at the one kept). */
  meal: Map<string, string>;
  /** v1 pantry product id → its format. */
  pantryFormat: Map<string, string>;
  /** v1 pantry product id → its product. */
  pantryProduct: Map<string, string>;
  /** A food's unit (g or ml), from its ingredient. */
  unit: Map<string, string>;
};

const rows = (v1: V1Export, t: string): V1Row[] => v1.tables[t] ?? [];
const day = (x: unknown) => (typeof x === "string" ? x.slice(0, 10) : null);

/** Item names stay unique per catalog and parent among live items (the schema's live-name index). */
class Names {
  private readonly used = new Set<string>();
  constructor(private readonly out: Out) {}
  /** A taken name gives way to `alternative` (a product's full v1 name), else to «name (2)». */
  take(
    catalog: string,
    parent: string | null,
    name: string,
    live: boolean,
    alternative?: string,
  ): string {
    if (!live) return name;
    let n = name.trim() || "—";
    const alt = alternative?.trim();
    if (
      this.used.has(this.key(catalog, parent, n)) &&
      alt &&
      !this.used.has(this.key(catalog, parent, alt))
    ) {
      this.out.notes.push(
        `${catalog} «${name}» appears twice under one parent: the second is «${alt}»`,
      );
      n = alt;
    }
    for (let i = 2; this.used.has(this.key(catalog, parent, n)); i++) {
      if (i === 2)
        this.out.notes.push(
          `${catalog} «${name}» appears twice: the second is «${name} (2)»`,
        );
      n = `${name} (${i})`;
    }
    this.used.add(this.key(catalog, parent, n));
    return n;
  }
  private key(c: string, p: string | null, n: string) {
    return `${c}|${p ?? ""}|${n.toLowerCase()}`;
  }
}

/** An ingredient's own values as v2 fields. */
function ingredientValues(i: V1Row): [string, ReturnType<typeof num>][] {
  const out: [string, ReturnType<typeof num>][] = NUTRIENTS.map(([c, f]) => [
    f,
    num(i[c]),
  ]);
  const types = Array.isArray(i["fiberTypes"]) ? (i["fiberTypes"] as string[]) : [];
  out.push(["fibreTypes", text(types.join(","))]);
  out.push(["nova", num(i["nova"])]);
  out.push(["origin", text(i["origin"])]);
  out.push(["description", text(i["description"])]);
  out.push(["unit", text(i["unit"])]);
  return out;
}

const same = (a: ReturnType<typeof num>, b: ReturnType<typeof num>) => {
  if (a === null || b === null) return a === b;
  if ("num" in a && "num" in b) return new Big(a.num).eq(b.num);
  return JSON.stringify(a) === JSON.stringify(b);
};

/** The refined copy's estimate of a food's missing values, flattened to fields. */
function estimateValues(e: Record<string, unknown>): [string, ReturnType<typeof num>][] {
  const out: [string, ReturnType<typeof num>][] = [];
  const flat = (prefix: string, o: unknown) => {
    if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o as Record<string, unknown>))
      if (typeof v === "number") out.push([`${prefix}${k}`, num(v)]);
      else if (v && typeof v === "object") flat(`${prefix}${k}_`, v);
  };
  flat("", e["kinds"]);
  flat("fibre_", e["fiberTypes"]);
  flat("", e["micros"]);
  if (typeof e["water"] === "number") out.push(["water", num(e["water"])]);
  if (typeof e["origin"] === "string") out.push(["origin", text(e["origin"])]);
  if (typeof e["group"] === "string") out.push(["group", text(e["group"])]);
  return out;
}

export function convertCatalog(v1: V1Export, out: Out): CatalogMaps {
  const names = new Names(out);
  const ingredients = new Map(rows(v1, "ingredients").map((i) => [String(i["id"]), i]));
  const maps: CatalogMaps = {
    ingredient: new Map(),
    meal: new Map(),
    pantryFormat: new Map(),
    pantryProduct: new Map(),
    unit: new Map(),
  };
  const estimates = v1._estimates?.ingredients ?? {};
  const item = (
    id: string,
    catalog: string,
    name: string,
    extra: {
      parentId?: string | null;
      deletedAt?: string | null;
      archivedAt?: string | null;
      createdAt?: string | null;
      alternative?: string;
    } = {},
  ) => {
    const live = !extra.deletedAt;
    out.push("catalog_items", {
      id,
      catalog,
      name: names.take(catalog, extra.parentId ?? null, name, live, extra.alternative),
      parentId: extra.parentId ?? null,
      deletedAt: extra.deletedAt ?? null,
      archivedAt: extra.archivedAt ?? null,
      ...(extra.createdAt ? { createdAt: extra.createdAt } : {}),
    });
  };
  const writeValues = (
    id: string,
    values: [string, ReturnType<typeof num>][],
    skip?: (f: string, v: ReturnType<typeof num>) => boolean,
  ) => {
    for (const [f, v] of values) if (!skip?.(f, v)) out.itemValue(id, f, v);
  };
  const writeEstimate = (id: string, ingredientId: string) => {
    const e = estimates[ingredientId];
    if (!e) return;
    const meta = {
      source: `estimate: ${e.provenance?.source ?? "the refined copy"}`,
      confidence: confidenceOf(e.provenance),
    };
    for (const [f, v] of estimateValues(e))
      if (out.itemValue(id, f, v, meta)) out.estimates++;
  };

  const v2 = v1._v2;
  if (v2)
    convertIdentity(v1, v2, out, ingredients, maps, item, writeValues, writeEstimate);
  // Ingredients the identity layer does not cover (or all of them without it): one food each.
  for (const [id, i] of ingredients) {
    if (maps.ingredient.has(id)) continue;
    item(id, "food", String(i["name"]), {
      deletedAt: iso(i["deletedAt"]),
      createdAt: iso(i["createdAt"]),
    });
    writeValues(id, ingredientValues(i));
    writeEstimate(id, id);
    maps.ingredient.set(id, { food: id, product: null, format: null });
    maps.unit.set(id, String(i["unit"] ?? "g"));
    const cents = dec(i["packagePriceCents"]);
    const size = dec(i["packageSize"]);
    if (cents !== null && size !== null && Number(size) > 0) {
      const product = idFor("product", id);
      const format = idFor("format", id);
      item(product, "product", "v1", { parentId: id, deletedAt: iso(i["deletedAt"]) });
      item(format, "format", `${size} ${i["unit"] ?? "g"}`, {
        parentId: product,
        deletedAt: iso(i["deletedAt"]),
      });
      out.itemValue(format, "size", num(size));
      out.push("price_observations", {
        formatId: format,
        shop: "",
        day: day(i["createdAt"]) ?? v1.exportedAt.slice(0, 10),
        cents: Math.round(Number(cents)),
        packageQty: size,
        unit: String(i["unit"] ?? "g"),
        source: "import",
      });
    }
  }

  for (const t of rows(v1, "tags")) {
    item(String(t["id"]), "tag", String(t["name"]), { createdAt: iso(t["createdAt"]) });
    out.itemValue(String(t["id"]), "icon", text(t["icon"]));
  }
  for (const it of rows(v1, "ingredient_tags")) {
    const food = maps.ingredient.get(String(it["ingredientId"]))?.food;
    if (food) out.itemValue(food, `tag:${String(it["tagId"])}`, ref(String(it["tagId"])));
  }
  for (const c of rows(v1, "ingredient_compounds")) {
    const food = maps.ingredient.get(String(c["ingredientId"]))?.food;
    if (food) out.itemValue(food, String(c["compound"]), num(c["amount"]));
  }

  convertRecipes(v1, out, maps, item);
  convertTraining(v1, out, item);
  for (const c of rows(v1, "money_categories")) {
    const id = String(c["id"]);
    item(id, "money_category", String(c["name"]), {
      parentId: str(c["parentId"]),
      deletedAt: iso(c["deletedAt"]),
      createdAt: iso(c["createdAt"]),
    });
    out.itemValue(id, "key", text(c["key"]));
    out.itemValue(id, "kind", text(c["kind"]));
    out.itemValue(id, "icon", text(c["icon"]));
    out.itemValue(id, "position", num(c["position"]));
  }
  // v1's pantry products: the refined layer's product of the same brand under the same food is the
  // same product (created only when none exists, migration.md), and its format of the same size too.
  const byBrand = new Map(
    (v1._v2?.products ?? []).map((p) => [`${p.food}|${p.brand.toLowerCase()}`, p.id]),
  );
  const bySize = new Map(
    (v1._v2?.formats ?? []).map((f) => [`${f.product}|${f.size}|${f.unit}`, f.id]),
  );
  for (const p of rows(v1, "products")) {
    const id = String(p["id"]);
    const landed = maps.ingredient.get(String(p["ingredientId"]));
    if (!landed) {
      out.drop("products", 1, "its ingredient is not in the export");
      continue;
    }
    const brand = str(p["brand"]) ?? String(p["name"]);
    const size = dec(p["packageSize"]);
    const unit = String(p["unit"] ?? "g");
    const existing = byBrand.get(`${landed.food}|${brand.toLowerCase()}`);
    const product = existing ?? id;
    if (!existing)
      item(id, "product", brand, {
        parentId: landed.food,
        deletedAt: iso(p["deletedAt"]),
        createdAt: iso(p["createdAt"]),
        alternative: String(p["name"]),
      });
    else
      out.notes.push(
        `pantry product «${String(p["name"])}» is the refined layer's «${brand}» of its food`,
      );
    const sameSize =
      size === null ? undefined : bySize.get(`${product}|${Number(size)}|${unit}`);
    const format = sameSize ?? idFor("format", "pantry", id);
    if (!sameSize)
      item(format, "format", size ? `${size} ${unit}` : "confezione", {
        parentId: product,
        deletedAt: iso(p["deletedAt"]),
      });
    out.itemValue(product, "name", text(p["name"]));
    out.itemValue(product, "notes", text(p["notes"]));
    out.itemValue(product, "shop", text(p["shop"]));
    out.itemValue(format, "size", num(size));
    out.itemValue(format, "unit", text(p["unit"]));
    out.itemValue(format, "barcode", text(p["barcode"]));
    maps.pantryFormat.set(id, format);
    maps.pantryProduct.set(id, product);
  }
  return maps;
}

function convertIdentity(
  v1: V1Export,
  v2: RefinedV2,
  out: Out,
  ingredients: Map<string, V1Row>,
  maps: CatalogMaps,
  item: (
    id: string,
    catalog: string,
    name: string,
    extra?: {
      parentId?: string | null;
      deletedAt?: string | null;
      archivedAt?: string | null;
      alternative?: string;
    },
  ) => void,
  writeValues: (
    id: string,
    values: [string, ReturnType<typeof num>][],
    skip?: (f: string, v: ReturnType<typeof num>) => boolean,
  ) => void,
  writeEstimate: (id: string, ingredientId: string) => void,
) {
  const valuesOf = (ingredientId: string) => {
    const i = ingredients.get(ingredientId);
    return i ? ingredientValues(i) : [];
  };
  const resolved = new Map<string, Map<string, ReturnType<typeof num>>>();
  for (const f of v2.foods) {
    item(f.id, "food", f.name, { archivedAt: f.archived ? v1.exportedAt : null });
    const values = valuesOf(f.valuesFrom);
    writeValues(f.id, values);
    if (f.group && f.group !== "?") out.itemValue(f.id, "group", text(f.group));
    writeEstimate(f.id, f.valuesFrom);
    resolved.set(f.id, new Map(values));
    for (const i of f.from) {
      maps.ingredient.set(i, { food: f.id, product: null, format: null });
      maps.unit.set(f.id, String(ingredients.get(i)?.["unit"] ?? "g"));
    }
  }
  // A product holds only what its label says differently from its food.
  for (const p of v2.products) {
    const full = ingredients.get(p.label)?.["name"];
    item(p.id, "product", p.brand, {
      parentId: p.food,
      ...(typeof full === "string" ? { alternative: full } : {}),
    });
    const base = resolved.get(p.food) ?? new Map();
    const values = valuesOf(p.label);
    writeValues(p.id, values, (f, v) => same(base.get(f) ?? null, v));
    resolved.set(p.id, new Map([...base, ...values]));
    for (const i of p.from)
      maps.ingredient.set(i, { food: p.food, product: p.id, format: null });
  }
  const productFood = new Map(v2.products.map((p) => [p.id, p.food]));
  for (const f of v2.formats) {
    item(f.id, "format", f.name, { parentId: f.product });
    out.itemValue(f.id, "size", num(f.size));
    out.itemValue(f.id, "unit", text(f.unit));
    out.itemValue(f.id, "barcode", text(f.barcode));
    out.itemValue(f.id, "shape", bool(f.shape));
    if (f.ownValues) {
      const base = resolved.get(f.product) ?? new Map();
      writeValues(f.id, valuesOf(f.ownValues), (field, v) =>
        same(base.get(field) ?? null, v),
      );
    }
    maps.ingredient.set(f.from, {
      food: productFood.get(f.product)!,
      product: f.product,
      format: f.id,
    });
  }
  for (const p of v2.price_observations)
    out.push("price_observations", {
      formatId: p.format,
      shop: p.shop ?? "",
      day: p.day,
      cents: p.cents,
      packageQty: String(p.qty),
      unit: p.unit,
      source: "import",
    });
}

function convertRecipes(
  v1: V1Export,
  out: Out,
  maps: CatalogMaps,
  item: (
    id: string,
    catalog: string,
    name: string,
    extra?: { deletedAt?: string | null; createdAt?: string | null },
  ) => void,
) {
  const merges = v1._v2?.meal_merges ?? [];
  const mergedInto = new Map(merges.flatMap((m) => m.merged.map((x) => [x, m] as const)));
  const keptName = new Map(merges.map((m) => [m.keep, m.name]));
  const estimates = v1._estimates?.meals ?? {};
  for (const m of rows(v1, "meals")) {
    const id = String(m["id"]);
    const merge = mergedInto.get(id);
    if (merge) {
      maps.meal.set(id, merge.keep);
      continue;
    }
    maps.meal.set(id, id);
    item(id, "recipe", keptName.get(id) ?? String(m["name"]), {
      deletedAt: iso(m["deletedAt"]),
      createdAt: iso(m["createdAt"]),
    });
    out.itemValue(id, "role", text(m["category"]));
    out.itemValue(id, "notes", text(m["notes"]));
    out.itemValue(id, "review", text(m["review"]));
    const e = estimates[id];
    if (
      e &&
      out.itemValue(id, "dish", text(e["dish"]), {
        source: `estimate: ${e.provenance?.source ?? "the refined copy"}`,
        confidence: confidenceOf(e.provenance),
      })
    )
      out.estimates++;
  }
  const merged = rows(v1, "meal_items").filter((mi) =>
    mergedInto.has(String(mi["mealId"])),
  );
  out.drop(
    "meal_items",
    merged.length,
    "items of a merged meal: the meal kept has the same foods (meal_merges)",
  );
  const pointers = v1._v2?.pointers.meal_items ?? {};
  for (const mi of rows(v1, "meal_items")) {
    if (mergedInto.has(String(mi["mealId"]))) continue;
    const ptr = pointers[String(mi["id"])];
    const food = ptr?.food ?? maps.ingredient.get(String(mi["ingredientId"]))?.food;
    if (!food) {
      out.drop("meal_items", 1, "its ingredient is not in the export");
      continue;
    }
    out.push("catalog_parts", {
      itemId: String(mi["mealId"]),
      position: Number(mi["position"] ?? 0),
      partItemId: food,
      quantity: dec(mi["quantity"]),
      unit: maps.unit.get(food) ?? "g",
      defaults: ptr?.preferredProduct ? { preferredProduct: ptr.preferredProduct } : {},
    });
  }
  for (const f of rows(v1, "rating_factors")) {
    item(String(f["id"]), "rating_factor", String(f["name"]));
    out.itemValue(String(f["id"]), "position", num(f["position"]));
  }
  for (const r of rows(v1, "meal_ratings")) {
    const recipe = maps.meal.get(String(r["mealId"]));
    if (recipe) out.itemValue(recipe, `rating:${String(r["factorId"])}`, num(r["score"]));
  }
}

function convertTraining(
  v1: V1Export,
  out: Out,
  item: (
    id: string,
    catalog: string,
    name: string,
    extra?: { deletedAt?: string | null; createdAt?: string | null },
  ) => void,
) {
  const estimates = v1._estimates?.exercises ?? {};
  for (const e of rows(v1, "exercises")) {
    const id = String(e["id"]);
    item(id, "exercise", String(e["name"]), {
      deletedAt: iso(e["deletedAt"]),
      createdAt: iso(e["createdAt"]),
    });
    out.itemValue(id, "kind", text(e["kind"]));
    out.itemValue(id, "pattern", text(e["pattern"]));
    out.itemValue(id, "equipment", text(e["equipment"]));
    out.itemValue(id, "unilateral", bool(e["unilateral"]));
    const groups = Array.isArray(e["muscleGroups"])
      ? (e["muscleGroups"] as string[])
      : [];
    out.itemValue(id, "muscleGroups", text(groups.join(",")));
    out.itemValue(id, "notes", text(e["notes"]));
    const est = estimates[id];
    if (est) {
      const meta = {
        source: `estimate: ${est.provenance?.source ?? "the refined copy"}`,
        confidence: confidenceOf(est.provenance),
      };
      const g = Array.isArray(est["muscleGroups"])
        ? (est["muscleGroups"] as string[]).join(",")
        : null;
      if (out.itemValue(id, "muscleGroups", text(g), meta)) out.estimates++;
      if (out.itemValue(id, "guide", text(est["guide"]), meta)) out.estimates++;
    }
  }
  for (const r of rows(v1, "routines")) {
    const id = String(r["id"]);
    item(id, "routine", String(r["name"]), { deletedAt: iso(r["deletedAt"]) });
    out.itemValue(id, "notes", text(r["notes"]));
    out.itemValue(id, "position", num(r["position"]));
    out.itemValue(id, "itemsSavedAt", text(r["itemsSavedAt"]));
  }
  for (const ri of rows(v1, "routine_items")) {
    const defaults: Record<string, unknown> = {};
    for (const k of ["sets", "reps", "loadKg", "restS", "durationS"])
      if (ri[k] !== null && ri[k] !== undefined) defaults[k] = ri[k];
    out.push("catalog_parts", {
      itemId: String(ri["routineId"]),
      position: Number(ri["position"] ?? 0),
      partItemId: String(ri["exerciseId"]),
      quantity: null,
      unit: null,
      defaults,
    });
  }
}
