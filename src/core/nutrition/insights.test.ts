/** Tests for core/nutrition/insights.ts. */
import { describe, expect, it } from "vitest";
import { macroSplit, pricePerThousandCents, proteinPer100kcal } from "./insights";

describe("insights", () => {
  it("splits energy by macronutrient from the grams", () => {
    // 30 g P (120 kcal), 50 g C (200 kcal), 20 g F (180 kcal) = 500 kcal.
    expect(macroSplit({ protein: "30", carbs: "50", fat: "20" })).toEqual({
      protein: 24,
      carbs: 40,
      fat: 36,
      fiber: 0,
      sugars: 0,
      saturatedFat: 0,
    });
    expect(macroSplit({ protein: "0", carbs: "0", fat: "0" })).toBeNull();
  });

  it("includes fibre (2 kcal/g) and the sugars / saturated parts", () => {
    // 20 g P (80), 40 g C (160) of which 10 g sugars (40), 10 g F (90) of
    // which 4 g saturated (36), 10 g fibre (20) = 350 kcal.
    expect(
      macroSplit({
        protein: "20",
        carbs: "40",
        fat: "10",
        fiber: "10",
        sugars: "10",
        saturatedFat: "4",
      }),
    ).toEqual({
      protein: 23,
      carbs: 46,
      fat: 26,
      fiber: 6,
      sugars: 11,
      saturatedFat: 10,
    });
  });

  it("caps a sub-share at its macro (label rounding)", () => {
    expect(
      macroSplit({ protein: "0", carbs: "5", fat: "0", sugars: "5.2" })?.sugars,
    ).toBe(100);
  });

  it("computes protein density and price per kg", () => {
    expect(proteinPer100kcal({ kcal: "380", protein: "78" })).toBe("20.5");
    expect(proteinPer100kcal({ kcal: "0", protein: "0" })).toBeNull();
    expect(pricePerThousandCents({ packagePriceCents: 189, packageSize: "500" })).toBe(
      378,
    );
    expect(
      pricePerThousandCents({ packagePriceCents: null, packageSize: null }),
    ).toBeNull();
  });
});
