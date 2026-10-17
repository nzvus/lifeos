import { describe, expect, it } from "vitest";
import { dayFood, type FoodEntry } from "./day";

const oats = { name: "Avena", quantity: "80", values: { kcal: "372", protein: "13.5" } };
const milk = { name: "Latte", quantity: "200", values: { kcal: "46", protein: "3.4" } };
const meal = (status: FoodEntry["status"], lines: FoodEntry["lines"], more = {}) =>
  ({ status, leftOut: false, servings: null, lines, ...more }) as FoodEntry;

describe("a day's food", () => {
  it("adds the done meals as eaten, the planned ones still in the plan apart", () => {
    const f = dayFood([
      meal("done", [oats, milk]),
      meal("planned", [milk]),
      meal("planned", [oats], { leftOut: true }),
      meal("skipped", [oats]),
    ]);
    expect(f.eaten).toEqual({ kcal: "389.6", protein: "17.6" });
    expect(f.planned).toEqual({ kcal: "92", protein: "6.8" });
  });

  it("says where each nutrient came from, by name, largest first, with servings", () => {
    const f = dayFood([
      meal("done", [milk]),
      meal("done", [oats, milk], { servings: "0.5" }),
    ]);
    expect(f.sources["protein"]).toEqual([
      { name: "Latte", amount: "10.2" },
      { name: "Avena", amount: "5.4" },
    ]);
    expect(f.sources["kcal"]!.map((s) => s.name)).toEqual(["Avena", "Latte"]);
  });

  it("is empty on a day with no meals", () => {
    expect(dayFood([])).toEqual({
      eaten: {},
      planned: {},
      sources: {},
      kinds: { protein: {}, carbs: {}, fat: {}, fibre: {} },
    });
  });
});
