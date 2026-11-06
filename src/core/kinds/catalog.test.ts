import { describe, expect, it } from "vitest";
import { MODES } from "../movement/routes";
import { BUILTIN_KINDS } from "./builtins";
import {
  CATALOG_TYPES,
  catalogType,
  catalogTypeSchema,
  ROUTE_MODES,
  typeOfItem,
  valuesSchema,
} from "./catalog";

describe("catalog types in the registry (MOD-01, MOD-02)", () => {
  it("declares the ten catalog types of model.md §3, each once", () => {
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
    expect(valuesSchema(catalogType("food")!).safeParse({ kcal: 100 }).success).toBe(
      false,
    );
  });

  it("route modes equal core/movement's", () => {
    expect([...ROUTE_MODES]).toEqual([...MODES]);
  });
});
