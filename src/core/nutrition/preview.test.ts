/** Tests for core/nutrition/preview.ts — the "add to the day" preview. */
import { describe, expect, it } from "vitest";
import { estimateValues, scaleMacros } from "./preview";

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
