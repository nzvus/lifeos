import { describe, expect, it } from "vitest";
import type { FoodChoice, RecipeChoice } from "@/core/food/choices";
import { collapseBrands, withVariants } from "./LinePicks";

const c = (key: string, brand: string | null): FoodChoice => ({
  key,
  foodId: key.split(":")[0]!,
  productId: key.includes(":") ? key.split(":")[1]! : null,
  name: "Passata di pomodoro",
  brand,
  unit: "g",
  per100: {},
  uses: 0,
  lastQty: null,
});
const r = (recipeId: string, baseId?: string): RecipeChoice => ({
  key: "recipe:" + recipeId,
  recipeId,
  name: recipeId,
  parts: [],
  uses: 0,
  ...(baseId ? { baseId } : {}),
});

describe("the composer's family picks (ADR-0060)", () => {
  it("a food with brands shows once, a brand only when named", () => {
    const found = [c("p", null), c("p:m", "Mutti"), c("p:c", "Cirio")];
    expect(collapseBrands(found, "passata").map((x) => x.key)).toEqual(["p"]);
    expect(collapseBrands(found, "passata mutti").map((x) => x.key)).toEqual([
      "p",
      "p:m",
    ]);
  });

  it("variants come right after their base, which says how many it has", () => {
    const out = withVariants([
      r("Gelato al pistacchio", "Gelato"),
      r("Avena"),
      r("Gelato"),
    ]);
    expect(out.map((x) => [x.r.recipeId, x.variants, x.under])).toEqual([
      ["Avena", 0, null],
      ["Gelato", 1, null],
      ["Gelato al pistacchio", 0, "Gelato"],
    ]);
  });
});
