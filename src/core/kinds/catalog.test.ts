import { describe, expect, it } from "vitest";
import { MODES } from "../movement/routes";
import { SNAPSHOT_FIELDS } from "../food/choices";
import { BUILTIN_KINDS } from "./builtins";
import {
  CATALOG_TYPES,
  LABEL_FIELDS,
  catalogType,
  catalogTypeSchema,
  ROUTE_MODES,
  areaSlug,
  typeAtSlug,
  typeSlug,
  typeOfItem,
  valuesSchema,
} from "./catalog";

describe("catalog types in the registry (MOD-01, MOD-02)", () => {
  it("declares the twelve catalog types of model.md §3, each once (MOD-36: blocco, ciclo)", () => {
    expect(CATALOG_TYPES.map((t) => t.name)).toEqual([
      "cibo",
      "prodotto",
      "formato",
      "pasto",
      "assunzione",
      "esercizio",
      "scheda",
      "tragitto",
      "tracker",
      "categoria di spesa",
      "blocco",
      "ciclo",
    ]);
    expect(new Set(CATALOG_TYPES.map((t) => t.key)).size).toBe(CATALOG_TYPES.length);
  });

  it("never shares a key with a voce kind: one registry, one key per type", () => {
    const voce = new Set(BUILTIN_KINDS.map((k) => k.key));
    expect(CATALOG_TYPES.filter((t) => voce.has(t.key))).toEqual([]);
  });

  it("MOD-21: parentId means one declared thing — levels name a declared parent type", () => {
    for (const t of CATALOG_TYPES)
      if (t.family.rule === "levels" && t.family.parent)
        expect(catalogType(t.family.parent)).toBeDefined();
    expect(catalogType("product")?.family).toEqual({ rule: "levels", parent: "food" });
    expect(catalogType("recipe")?.family).toEqual({ rule: "variants" });
  });

  it("refuses «Variante» without the variants rule, and «Salva come» without lines", () => {
    const base = {
      key: "x",
      name: "x",
      area: "Oggi",
      hue: "habit",
      storage: { table: "kinds" },
      capture: "form",
      list: { sort: ["name"], search: ["name"] },
    } as const;
    expect(() =>
      catalogTypeSchema.parse({ ...base, family: { rule: "none" }, verbs: ["variant"] }),
    ).toThrow(/variants rule/);
    expect(() =>
      catalogTypeSchema.parse({
        ...base,
        family: { rule: "none" },
        verbs: ["saveAs"],
        savedFrom: { kind: "meal", parts: "lines" },
      }),
    ).toThrow(/needs lines/);
  });

  it("a «Salva come» source is a voce kind (MOD-14)", () => {
    const voce = new Set(BUILTIN_KINDS.map((k) => k.key));
    for (const t of CATALOG_TYPES)
      if (t.savedFrom) expect(voce.has(t.savedFrom.kind)).toBe(true);
  });

  it("finds a stored item's type from its catalog and flags", () => {
    expect(typeOfItem("food")?.key).toBe("food");
    expect(typeOfItem("food", new Set(["intake"]))?.key).toBe("intake_item");
    expect(typeOfItem("routine")?.name).toBe("scheda");
    expect(typeOfItem("nothing")).toBeUndefined();
  });

  it("validates a type's values from its fields (PAT-24)", () => {
    const route = valuesSchema(catalogType("route")!);
    expect(route.safeParse({ mode: "bike", distanceKm: 4.2 }).success).toBe(true);
    expect(route.safeParse({ mode: "plane" }).success).toBe(false);
    expect(route.safeParse({ distanceKm: -1 }).success).toBe(false);
    expect(route.safeParse({ colour: "red" }).success).toBe(false); // undeclared: refused
    const food = valuesSchema(catalogType("food")!);
    expect(food.safeParse({ kcal: 100 }).success).toBe(true); // label values (MOD-02)
    expect(food.safeParse({ kcal: 901 }).success).toBe(false);
    expect(food.safeParse({ calcium: 120 }).success).toBe(false); // not a label value
  });

  it("MOD-02 the label fields are the values a food line snapshots (core/food)", () => {
    expect(LABEL_FIELDS.map((f) => f.key)).toEqual([...SNAPSHOT_FIELDS]);
    expect(catalogType("product")!.fields.map((f) => f.key)).toEqual([
      ...SNAPSHOT_FIELDS,
    ]);
  });

  it("route modes equal core/movement's", () => {
    expect([...ROUTE_MODES]).toEqual([...MODES]);
  });

  it("each type has one address word, and the address finds it back (PAT-04)", () => {
    const slugs = CATALOG_TYPES.map(typeSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const t of CATALOG_TYPES) {
      expect(typeSlug(t)).toMatch(/^[a-z-]+$/);
      expect(typeAtSlug(typeSlug(t))).toBe(t);
    }
    expect(typeSlug(catalogType("money_category")!)).toBe("categoria-di-spesa");
    expect(areaSlug(catalogType("route")!)).toBe("corpo");
    expect(typeAtSlug("nessuno")).toBeNull();
  });
});

describe("a blocco's «ogni quanto» (PL-20, PAT-61)", () => {
  it("the registry takes the engine's recurrence as JSON text, and refuses anything else", () => {
    const s = valuesSchema(catalogType("block")!);
    expect(
      s.safeParse({ recurrence: '{"type":"weekdays","days":[1,3,5]}' }).success,
    ).toBe(true);
    expect(s.safeParse({ recurrence: '{"type":"timesPerWeek","n":9}' }).success).toBe(
      false,
    );
    expect(s.safeParse({ recurrence: "ogni giorno" }).success).toBe(false);
  });
});
