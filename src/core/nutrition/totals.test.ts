/**
 * Tests for core/nutrition/totals.ts — the arithmetic behind "totals = parts".
 * Pure functions, no database: these run in milliseconds.
 */
import { describe, expect, it } from "vitest";
import { NUTRIENT_KEYS, type NutrientValues } from "./nutrients";
import { addTotals, sumLines, toDisplay, type TotalsLine } from "./totals";

/** Per-100 values where every nutrient is the same number (keeps tests short). */
function flat(v: string): NutrientValues {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, v])) as NutrientValues;
}

const line = (
  quantity: string,
  per100: string,
  price: number | null = null,
): TotalsLine => ({
  quantity,
  per100: flat(per100),
  packagePriceCents: price,
  packageSize: price === null ? null : "1000",
});

describe("sumLines", () => {
  it("scales per-100 values by quantity", () => {
    const t = toDisplay(sumLines([line("150", "10")])); // 150 g of 10 per 100 g
    expect(t.nutrients.kcal).toBe("15.0");
  });

  it("is exact where floating point is not", () => {
    // In floats, 0.1 + 0.2 = 0.30000000000000004. Ten lines of 0.1 kcal each
    // (100 g of 0.1/100 g) must add to exactly 1.
    const lines = Array.from({ length: 10 }, () => line("100", "0.1"));
    expect(sumLines(lines).nutrients.kcal.toString()).toBe("1");
  });

  it("applies the servings factor", () => {
    const t = toDisplay(sumLines([line("100", "20")], "1.5"));
    expect(t.nutrients.protein).toBe("30.0");
  });

  it("computes cost from package price and flags unknown prices", () => {
    // 250 g of a 1000 g package costing 400 cents = 100 cents.
    const priced = sumLines([line("250", "1", 400)]);
    expect(toDisplay(priced)).toMatchObject({ costCents: 100, costComplete: true });
    const mixed = sumLines([line("250", "1", 400), line("100", "1", null)]);
    expect(toDisplay(mixed)).toMatchObject({ costCents: 100, costComplete: false });
  });

  it("gives zeros for an empty list", () => {
    expect(toDisplay(sumLines([])).nutrients.fat).toBe("0.0");
  });
});

describe("addTotals + toDisplay (totals = parts)", () => {
  it("adds exact values and rounds only once", () => {
    // Each part is 0.04 kcal -> each displays as "0.0". Three parts are 0.12
    // -> "0.1". Summing the rounded labels would wrongly give 0.0.
    const part = sumLines([line("1", "4")]); // 1 g of 4/100 g = 0.04
    expect(toDisplay(part).nutrients.kcal).toBe("0.0");
    expect(toDisplay(addTotals([part, part, part])).nutrients.kcal).toBe("0.1");
  });
});
