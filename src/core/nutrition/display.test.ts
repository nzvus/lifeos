/** Tests for core/nutrition/display.ts — the shared display values. */
import { describe, expect, it } from "vitest";
import { detailLines, stripValues } from "./display";
import type { TotalsLine } from "./totals";

const zero = { sugars: "0", saturatedFat: "0", salt: "0" };

describe("stripValues", () => {
  it("formats kcal with its unit and grams without, in the user's locale", () => {
    const v = stripValues(
      { kcal: "422.2", protein: "15.8", carbs: "46", fat: "15.7", fiber: "14.3" },
      "it",
    );
    expect(v.energy).toBe("422 kcal");
    expect([v.protein, v.carbs, v.fat, v.fiber]).toEqual(["16", "46", "16", "14"]);
    expect(v.split).not.toBeNull();
  });

  it("keeps decimals when asked (per-100 lists)", () => {
    expect(
      stripValues(
        { kcal: "42", protein: "0.5", carbs: "10.5", fat: "0.1", fiber: "1.4" },
        "it",
        1,
      ).carbs,
    ).toBe("10,5");
  });
});

describe("detailLines", () => {
  const line: TotalsLine & { name: string; unit: string } = {
    name: "Prugne",
    unit: "g",
    quantity: "50",
    per100: {
      kcal: "42",
      protein: "0.5",
      carbs: "10.5",
      fat: "0.1",
      fiber: "1.4",
      ...zero,
    },
    packagePriceCents: null,
    packageSize: null,
  };

  it("shows the quantity actually eaten and its kcal, servings applied", () => {
    const [d] = detailLines([line], "2", "it");
    expect(d?.amount).toBe("100 g");
    expect(d?.values.energy).toBe("42 kcal");
  });
});
