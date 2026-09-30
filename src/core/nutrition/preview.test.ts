/** Tests for core/nutrition/preview.ts — the "add to the day" preview. */
import { describe, expect, it } from "vitest";
import {
  estimateValues,
  mealsUsing,
  percentChange,
  replaceIngredient,
  scaleMacros,
  sumMacros,
} from "./preview";

const per100 = { kcal: "42", protein: "0.5", carbs: "10.5", fat: "0.1", fiber: "1.4" };

describe("scaleMacros", () => {
  it("scales per-100 values by a quantity, exactly", () => {
    expect(scaleMacros(per100, "50", "100")).toEqual({
      kcal: "21",
      protein: "0.25",
      carbs: "5.25",
      fat: "0.05",
      fiber: "0.7",
    });
  });

  it("multiplies per-serving values by servings, accepting a comma", () => {
    expect(scaleMacros(per100, "1,5", "1")?.kcal).toBe("63");
  });

  it("is null while the amount is empty, zero or not a number", () => {
    expect(scaleMacros(per100, "", "100")).toBeNull();
    expect(scaleMacros(per100, "0", "1")).toBeNull();
    expect(scaleMacros(per100, "abc", "1")).toBeNull();
  });
});

describe("estimateValues", () => {
  const typed = { kcal: "", protein: "", carbs: "", fat: "", fiber: "" };

  it("needs kcal; empty macros count as zero", () => {
    expect(estimateValues(typed)).toBeNull();
    expect(estimateValues({ ...typed, kcal: "650", protein: "30,5" })).toEqual({
      kcal: "650",
      protein: "30.5",
      carbs: "0",
      fat: "0",
      fiber: "0",
    });
  });

  it("is null if any field is not a number", () => {
    expect(estimateValues({ ...typed, kcal: "650", fat: "tanto" })).toBeNull();
  });
});

describe("meal previews", () => {
  const skyr = { kcal: "62", protein: "11", carbs: "4", fat: "0.2", fiber: "0" };
  const oats = { kcal: "370", protein: "13", carbs: "60", fat: "7", fiber: "10" };

  it("sums the lines of a meal", () => {
    const lines = [scaleMacros(skyr, "200", "100")!, scaleMacros(oats, "50", "100")!];
    expect(sumMacros(lines)).toEqual({
      kcal: "309",
      protein: "28.5",
      carbs: "38",
      fat: "3.9",
      fiber: "5",
    });
    expect(sumMacros([]).kcal).toBe("0");
  });

  it("recomputes a meal when one ingredient's label changes", () => {
    const meal = sumMacros([
      scaleMacros(skyr, "200", "100")!,
      scaleMacros(oats, "50", "100")!,
    ]);
    const betterSkyr = { ...skyr, protein: "12" };
    const after = replaceIngredient(meal, "200", skyr, betterSkyr);
    expect(after.protein).toBe("30.5");
    expect(after.kcal).toBe(meal.kcal);
  });

  it("gives the change in whole percent, null from zero", () => {
    expect(percentChange("28.5", "30.5")).toBe(7);
    expect(percentChange("10", "5")).toBe(-50);
    expect(percentChange("0", "5")).toBeNull();
  });
});

describe("mealsUsing", () => {
  const totals = {
    nutrients: { kcal: "300", protein: "20", carbs: "30", fat: "10", fiber: "5" },
  };
  const meals = [
    {
      id: "m1",
      name: "Bowl",
      lines: [
        { ingredientId: "skyr", quantity: "150" },
        { ingredientId: "skyr", quantity: "50" },
      ],
      totals,
    },
    {
      id: "m2",
      name: "Toast",
      lines: [{ ingredientId: "bread", quantity: "60" }],
      totals,
    },
  ];

  it("finds the meals using an ingredient, quantities summed", () => {
    expect(mealsUsing(meals, "skyr")).toEqual([
      { id: "m1", name: "Bowl", quantity: "200", serving: totals.nutrients },
    ]);
    expect(mealsUsing(meals, "nothing")).toEqual([]);
  });
});
