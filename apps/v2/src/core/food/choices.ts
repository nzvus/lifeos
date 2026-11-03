/**
 * core/food/choices.ts — the composer's choices (V-04), pure so the browser
 * can search them: each live food, and each of its products, with its
 * values per 100 g (or ml) resolved as ADR-0055 says: a product holds only
 * what its label says differently from its food, so its values are the
 * food's with its own on top. Each carries how often it was eaten in the
 * last 90 days and the quantity of the last time, for the ranking (find.md
 * §2) and the line's starting quantity. Its price per 100 (core/food/cost,
 * a product's or else its food's) rides in `per100` as `cents`, so a logged
 * line keeps it in its snapshot (dossiers/costs.md §4). `catalog.ts` reads them.
 */
import { brandMean } from "./brands";
import { intakeOf, type IntakeOf } from "./intake";
import { PRICE_FIELD } from "./cost";
import { FIBRE_TYPES, KIND_FIELDS } from "./kinds";

/** The values a meal line keeps: the nutrients parity compares, and NOVA. */
export const SNAPSHOT_FIELDS = [
  "kcal",
  "protein",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fibre",
  "salt",
  "nova",
] as const;

export type FoodChoice = {
  /** The food's id, or "<food>:<product>". */
  key: string;
  /** Null only for an already logged line whose food was never known. */
  foodId: string | null;
  productId: string | null;
  name: string;
  /** The product's name (its brand), when the choice is a product. */
  brand: string | null;
  unit: string;
  per100: Record<string, string>;
  /** The food's estimates per 100 ("fat_mufa", "vitD"): kinds' shares and micros. */
  estimates?: Record<string, string>;
  uses: number;
  lastQty: string | null;
  /** What picks its drawing (icons.md §2: food group, dish, fine group); a product has its food's. */
  drawing?: Record<string, string>;
  /** An «assunzione» (FOOD-44): what one tap logs; only on the food's own choice. */
  intake?: IntakeOf;
  /** A food with brands, no brand chosen (ADR-0060): its values are their weighted mean. */
  brands?: {
    count: number;
    spread: Record<string, [number, number]>;
    uncertain: string[];
  };
};

/** The catalog fields Glyph reads to draw a food (icons.md §2). */
export const FOOD_DRAWING_FIELDS = ["group", "dish", "fine"] as const;
const DRAWING = new Set<string>(FOOD_DRAWING_FIELDS);

export type ItemRow = {
  id: string;
  catalog: string;
  name: string;
  parentId: string | null;
};
export type ValueRow = {
  itemId: string;
  field: string;
  num: string | null;
  text: string | null;
  bool?: boolean | null;
};
export type UseRow = {
  itemId: string;
  productId: string | null;
  uses: number;
  lastQty: string | null;
};

export const USE_DAYS = 90;
const FIELDS = new Set<string>(SNAPSHOT_FIELDS);
const KIND = new Set<string>(KIND_FIELDS);

/** Pure: the choices from the rows, foods first by name, each followed by its products. */
export function foodChoices(
  items: readonly ItemRow[],
  values: readonly ValueRow[],
  uses: readonly UseRow[],
  /** Cents per 100 by choice key (`choicePrices`). */
  prices: ReadonlyMap<string, string> = new Map(),
): FoodChoice[] {
  const per = new Map<string, Record<string, string>>();
  const kinds = new Map<string, Record<string, string>>();
  const unit = new Map<string, string>();
  const drawing = new Map<string, Record<string, string>>();
  const stored = new Map<string, Record<string, string | boolean>>();
  const compounds = new Map<string, Record<string, string>>();
  for (const v of values) {
    if (v.field === "unit" && v.text) unit.set(v.itemId, v.text);
    if (DRAWING.has(v.field) && v.text)
      drawing.set(v.itemId, { ...drawing.get(v.itemId), [v.field]: v.text });
    if (KIND.has(v.field) && v.num !== null)
      kinds.set(v.itemId, { ...kinds.get(v.itemId), [v.field]: v.num });
    if (v.field === FIBRE_TYPES && v.text)
      kinds.set(v.itemId, { ...kinds.get(v.itemId), [v.field]: v.text });
    if (FIELDS.has(v.field) && v.num !== null)
      per.set(v.itemId, { ...per.get(v.itemId), [v.field]: v.num });
    if (v.field === "intake" && typeof v.bool === "boolean")
      stored.set(v.itemId, { ...stored.get(v.itemId), intake: v.bool });
    if (v.field === "dose" && v.num !== null)
      stored.set(v.itemId, { ...stored.get(v.itemId), dose: v.num });
    if (v.field === "doseName" && v.text)
      stored.set(v.itemId, { ...stored.get(v.itemId), doseName: v.text });
    if ((v.field === "caffeine" || v.field === "creatine") && v.num !== null)
      compounds.set(v.itemId, { ...compounds.get(v.itemId), [v.field]: v.num });
  }
  const used = new Map(uses.map((u) => [u.itemId + ":" + (u.productId ?? ""), u]));
  const foods = items
    .filter((i) => i.catalog === "food")
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
  const products = items.filter((i) => i.catalog === "product");
  const out: FoodChoice[] = [];
  for (const f of foods) {
    const fp = prices.get(f.id);
    const base = { ...per.get(f.id), ...(fp ? { [PRICE_FIELD]: fp } : {}) };
    const u = used.get(f.id + ":");
    const at = out.length;
    out.push({
      key: f.id,
      foodId: f.id,
      productId: null,
      name: f.name,
      brand: null,
      unit: unit.get(f.id) ?? "g",
      per100: base,
      ...(kinds.has(f.id) ? { estimates: kinds.get(f.id)! } : {}),
      ...(drawing.has(f.id) ? { drawing: drawing.get(f.id)! } : {}),
      uses: u?.uses ?? 0,
      lastQty: u?.lastQty ?? null,
    });
    const intake = intakeOf({
      per100: base,
      ...(compounds.has(f.id) ? { compounds: compounds.get(f.id)! } : {}),
      stored: stored.get(f.id) ?? {},
      lastQty: u?.lastQty ?? null,
    });
    if (intake) out[at] = { ...out[at]!, intake };
    for (const p of products.filter((p) => p.parentId === f.id)) {
      const pu = used.get(f.id + ":" + p.id);
      out.push({
        key: f.id + ":" + p.id,
        foodId: f.id,
        productId: p.id,
        name: f.name,
        brand: p.name,
        unit: unit.get(p.id) ?? unit.get(f.id) ?? "g",
        per100: {
          ...base,
          ...per.get(p.id),
          ...(prices.has(f.id + ":" + p.id)
            ? { [PRICE_FIELD]: prices.get(f.id + ":" + p.id)! }
            : {}),
        },
        ...(kinds.has(f.id) ? { estimates: kinds.get(f.id)! } : {}),
        ...(drawing.has(f.id) ? { drawing: drawing.get(f.id)! } : {}),
        uses: pu?.uses ?? 0,
        lastQty: pu?.lastQty ?? null,
      });
    }
    // No brand chosen: the mean of its brands weighted by his use (ADR-0060, brands.ts);
    // lines he logged with no brand count as one more «brand», the food's own values.
    const mine = out.slice(at + 1);
    if (mine.length > 0) {
      const generic = out[at]!;
      const m = brandMean([
        ...mine.map((c) => ({ per100: c.per100, uses: c.uses })),
        ...(generic.uses > 0 ? [{ per100: generic.per100, uses: generic.uses }] : []),
      ])!;
      out[at] = {
        ...generic,
        per100: m.per100,
        brands: { count: mine.length, spread: m.spread, uncertain: m.uncertain },
      };
    }
  }
  return out;
}

/** "Caffè" and "caffe" are the same word to a search. */
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Pure: the choices whose name and brand hold every word typed, most eaten
 * first; with nothing typed, the most eaten.
 */
export function searchFoods(
  choices: readonly FoodChoice[],
  query: string,
  limit = 8,
): FoodChoice[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return choices
    .filter((c) => {
      if (words.length === 0) return c.uses > 0;
      const hay = fold(c.name + " " + (c.brand ?? ""));
      return words.every((w) => hay.includes(w));
    })
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name, "it"))
    .slice(0, limit);
}

/**
 * Pure: a logged meal's lines as choices keyed "line:<id>", each with its
 * own snapshot (ADR-0007): editing a meal changes its quantities, never the
 * values it was logged with, even after the catalog changed or the food
 * left it.
 */
export function lineChoices(
  lines: readonly {
    id: string;
    name: string;
    itemId: string | null;
    productId: string | null;
    unit: string;
    values: Record<string, string>;
  }[],
  /** The foods' kind estimates, so a logged line still splits into kinds. */
  kinds: ReadonlyMap<string, Record<string, string>> = new Map(),
): FoodChoice[] {
  return lines.map((l) => ({
    key: "line:" + l.id,
    foodId: l.itemId,
    productId: l.productId,
    name: l.name,
    brand: null,
    unit: l.unit,
    per100: l.values,
    ...(l.itemId && kinds.has(l.itemId) ? { estimates: kinds.get(l.itemId)! } : {}),
    uses: 0,
    lastQty: null,
  }));
}

/** A saved meal (a recipe) the composer can add whole: its foods at their quantities. */
export type RecipeChoice = {
  key: string;
  recipeId: string;
  name: string;
  parts: { key: string; quantity: string }[];
  uses: number;
  /** A saved estimate's typed totals (it has no parts); absent for a recipe of foods. */
  estimate?: Record<string, string>;
  /** A variant: its nearest base (ADR-0060); its parts are already resolved. */
  baseId?: string;
};

export type PartRow = {
  itemId: string;
  position: number;
  partItemId: string;
  quantity: string | null;
  defaults: Record<string, unknown>;
};

/**
 * Pure: the live recipes as choices. Each part names its food's choice, or
 * its preferred product's when that product is still a choice; a part whose
 * food left the catalog, or with no quantity, is not added. A saved estimate
 * (in `estimates`, by recipe) carries its totals instead of parts.
 */
export function recipeChoices(
  recipes: readonly { id: string; name: string; baseId?: string }[],
  parts: readonly PartRow[],
  uses: ReadonlyMap<string, number>,
  foods: readonly FoodChoice[],
  estimates: ReadonlyMap<string, Record<string, string>> = new Map(),
): RecipeChoice[] {
  const known = new Set(foods.map((f) => f.key));
  return recipes
    .map((r) => ({
      key: "recipe:" + r.id,
      recipeId: r.id,
      name: r.name,
      parts: parts
        .filter((p) => p.itemId === r.id && p.quantity !== null)
        .sort((a, b) => a.position - b.position)
        .flatMap((p) => {
          const product = p.defaults["preferredProduct"];
          const withProduct =
            typeof product === "string" ? p.partItemId + ":" + product : null;
          const key =
            withProduct && known.has(withProduct)
              ? withProduct
              : known.has(p.partItemId)
                ? p.partItemId
                : null;
          return key ? [{ key, quantity: p.quantity! }] : [];
        }),
      uses: uses.get(r.id) ?? 0,
      ...(estimates.has(r.id) ? { estimate: estimates.get(r.id)! } : {}),
      ...(r.baseId ? { baseId: r.baseId } : {}),
    }))
    .filter((r) => r.parts.length > 0 || r.estimate !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name, "it"));
}

/** Pure: the recipes whose name holds every word typed, most used first; none typed, the most used. */
export function searchRecipes(
  recipes: readonly RecipeChoice[],
  query: string,
  limit = 5,
): RecipeChoice[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return recipes
    .filter((r) =>
      words.length === 0 ? r.uses > 0 : words.every((w) => fold(r.name).includes(w)),
    )
    .sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name, "it"))
    .slice(0, limit);
}
