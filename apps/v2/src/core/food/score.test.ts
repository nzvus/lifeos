import { describe, expect, it } from "vitest";
import { score, FOOD } from "../engines/judgements";
import { foodParts, partsOf, type DailyRefs, type ScoreLine } from "./score";

// A man in his twenties (EFSA, E5) on a 2 778 kcal, 154 g protein, 39 g fibre day.
const refs: DailyRefs = {
  kcal: 2778,
  protein: 154,
  fibre: 39,
  micros: {
    k: 3500,
    ca: 1000,
    fe: 11,
    mg: 350,
    vitA: 750,
    vitC: 110,
    vitD: 15,
    folate: 330,
  },
};
const micros = (m: Record<string, number>) =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, String(v)]));

describe("the food and meal score's parts (meal-score.md §4)", () => {
  it("spinach-like: dense, within every known limit", () => {
    const spinach: ScoreLine = {
      quantity: "200",
      values: {
        kcal: "23",
        protein: "2.9",
        fibre: "2.2",
        fat: "0.4",
        carbs: "3.6",
        saturatedFat: "0.06",
        salt: "0.2",
      },
      estimates: {
        ...micros({
          k: 558,
          ca: 99,
          fe: 2.7,
          mg: 79,
          vitA: 469,
          vitC: 28,
          vitD: 0,
          folate: 194,
        }),
        protein_medium: "1",
        carbs_free: "0",
        carbs_intrinsic: "1",
        fat_n3: "0.14",
        fat_sfa: "0.06",
      },
    };
    const p = foodParts([spinach], null, refs)!;
    expect(p.density).toBeGreaterThanOrEqual(0.8);
    expect(p.limits).toBe(1);
    expect(p.value).toBeNull();
    expect(p.fit).toBeNull();
  });

  it("dark chocolate-like: sugars and saturated fat beyond twice their share score 0", () => {
    const choc: ScoreLine = {
      quantity: "30",
      values: {
        kcal: "549",
        protein: "6",
        fibre: "7",
        fat: "33",
        carbs: "50",
        saturatedFat: "20",
        salt: "0.02",
      },
      estimates: { carbs_free: "1", fat_sfa: "1", protein_medium: "1" },
    };
    const p = foodParts([choc], null, refs)!;
    // 30 g: 165 kcal, 6 g SFA; the day's SFA limit 30.9 g, a meal's 10 % floor 3.1 g → ≈ 1.9.
    expect(p.detail.limits["saturated"]).toBeCloseTo(6 / ((0.1 * 2778) / 9) / 0.1, 2);
    expect(p.limits).toBeLessThan(0.1);
    const s = score(FOOD, partsOf(p));
    // No micros in this line: too few nutrients for density, left out and named.
    expect(s.missing).toEqual(["density", "value", "fit"]);
  });

  it("a coffee has no score; what is not known is left out", () => {
    expect(foodParts([{ quantity: "30", values: { kcal: "2" } }], null, refs)).toBeNull();
    // Pasta with no estimates: no micros, no free sugars or trans; protein, fibre, sodium, SFA known.
    const p = foodParts(
      [
        {
          quantity: "100",
          values: {
            kcal: "360",
            protein: "12",
            fibre: "3",
            fat: "1.5",
            carbs: "72",
            saturatedFat: "0.3",
            salt: "0",
          },
        },
      ],
      null,
      refs,
    )!;
    expect(Object.keys(p.detail.density).sort()).toEqual(["fibre", "protein"]);
    // Two nutrients of eleven: too few to judge density.
    expect(p.density).toBeNull();
    expect(Object.keys(p.detail.limits).sort()).toEqual(["saturated", "sodium"]);
  });

  it("servings: density per 100 kcal stays; a limit's ratio grows with the meal past the 10 % floor", () => {
    const line: ScoreLine = {
      quantity: "100",
      values: { kcal: "400", protein: "20", fibre: "5", saturatedFat: "4", salt: "0.5" },
    };
    const one = foodParts([line], null, refs)!;
    const two = foodParts([line], "2", refs)!;
    expect(two.density).toBeCloseTo(one.density!, 10);
    // 400 kcal is 14 % of 2 778 (over the floor): twice the food, the same ratio of its twice-as-big allowance.
    expect(two.detail.limits["saturated"]).toBeCloseTo(
      one.detail.limits["saturated"]!,
      10,
    );
    const small = foodParts([{ ...line, quantity: "25" }], null, refs)!;
    // 100 kcal is under the floor: its allowance is the day's 10 %, so the ratio is a quarter of the 400 kcal one's × 1.4.
    expect(small.detail.limits["saturated"]).toBeLessThan(
      one.detail.limits["saturated"]!,
    );
  });
});
