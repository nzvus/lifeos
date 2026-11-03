import { describe, expect, it } from "vitest";
import type { FoodChoice, RecipeChoice } from "@/core/food/choices";
import { exerciseTwins, twinPairs } from "./twins";

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
    f("s1", "Mozzarella Brimi"),
    f("s2", "Mozzarella proteica"),
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
  it("the two peanut butters are one thing to merge; two mozzarellas are not listed", () => {
    expect(out.find((t) => t.kind === "food" && t.a.id.startsWith("b"))).toMatchObject({
      propose: "merge",
    });
    expect(out.some((t) => t.kind === "food" && t.a.id.startsWith("s"))).toBe(false);
  });
  it("a pair he called different is not asked again", () => {
    const again = twinPairs(foods, [], new Set(["b1|b2"]));
    expect(again.some((t) => t.kind === "food" && t.a.id.startsWith("b"))).toBe(false);
  });
  it("one base per family: the ice cream with the fewest foods, the others its variants", () => {
    const m = twinPairs(
      [],
      [
        r("g1", "GELATO proteico al pistacchio", ["milk", "whey", "pist"]),
        r("g2", "GELATO proteico nocciola", ["milk", "whey", "hazel", "cocoa"]),
        r("g3", "GELATO alla panna", ["milk", "whey", "cream", "wholemilk"]),
        r("a1", "AVENA, Marmellata", ["oats", "milk", "jam"]),
      ],
      new Set(),
    );
    expect(m.map((t) => t.kind === "meal" && [t.base.id, t.child.id])).toEqual([
      ["g1", "g2"],
      ["g1", "g3"],
    ]);
  });
});

describe("Run and Corsa are one (TRAIN-37, R5)", () => {
  it("keeps the Italian name; asks nothing when only one exists", () => {
    const ex = [
      { id: "r", name: "Run" },
      { id: "c", name: "Corsa" },
      { id: "t", name: "Tapis roulant" },
    ];
    expect(exerciseTwins(ex, new Set())).toEqual([
      { keep: { id: "c", name: "Corsa" }, gone: { id: "r", name: "Run" } },
    ]);
    expect(exerciseTwins(ex, new Set(["c|r"]))).toEqual([]);
  });
});
