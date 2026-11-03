import { describe, expect, it } from "vitest";
import type { FoodChoice, RecipeChoice } from "@/core/food/choices";
import { twinPairs } from "./twins";

const f = (foodId: string, name: string): FoodChoice => ({
  key: foodId,
  foodId,
  productId: null,
  name,
  brand: null,
  unit: "g",
  per100: {},
  uses: 0,
  lastQty: null,
});
const r = (id: string, name: string, foods: string[]): RecipeChoice => ({
  key: "recipe:" + id,
  recipeId: id,
  name,
  parts: foods.map((k) => ({ key: k, quantity: "10" })),
  uses: 0,
});

describe("«Possibili doppioni» on his data (objects.md §2)", () => {
  const foods = [
    f("p1", "Passata di pomodoro (Mutti)"),
    f("p2", "Passata di pomodoro"),
    f("b1", "Burro d'arachidi 100%"),
    f("b2", "Burro di arachidi 100%"),
    f("s1", "Semi di chia"),
    f("s2", "Semi di zucca"),
  ];
  const out = twinPairs(foods, [], new Set());
  it("the Mutti passata is proposed as a brand of the passata", () => {
    expect(out).toContainEqual({
      kind: "food",
      a: { id: "p1", name: "Passata di pomodoro (Mutti)" },
      b: { id: "p2", name: "Passata di pomodoro" },
      propose: "brand",
      brand: "Mutti",
    });
  });
  it("the two peanut butters are one thing to merge; chia and pumpkin seeds get no proposal", () => {
    expect(out.find((t) => t.kind === "food" && t.a.id.startsWith("b"))).toMatchObject({
      propose: "merge",
    });
    expect(out.find((t) => t.kind === "food" && t.a.id.startsWith("s"))).toMatchObject({
      propose: null,
    });
  });
  it("a pair he called different is not asked again", () => {
    const again = twinPairs(foods, [], new Set(["s1|s2"]));
    expect(again.some((t) => t.kind === "food" && t.a.id.startsWith("s"))).toBe(false);
  });
  it("two ice creams sharing their base: the smaller is the base", () => {
    const m = twinPairs(
      [],
      [
        r("g1", "GELATO proteico al pistacchio", ["milk", "whey", "pist"]),
        r("g2", "GELATO proteico nocciola", ["milk", "whey", "hazel"]),
        r("a1", "AVENA, Marmellata", ["oats", "milk", "jam"]),
      ],
      new Set(),
    );
    expect(m).toEqual([
      {
        kind: "meal",
        base: { id: "g1", name: "GELATO proteico al pistacchio" },
        child: { id: "g2", name: "GELATO proteico nocciola" },
      },
    ]);
  });
});
