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
    });
    expect(macroSplit({ protein: "0", carbs: "0", fat: "0" })).toBeNull();
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
