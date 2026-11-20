// MOD-61, VIS-107 (his §140): each line's share of each criterion's input, exact.
import { describe, expect, it } from "vitest";
import { lineShares } from "./score";

const refs = { kcal: 2000, protein: 120, fibre: 30, micros: {} };
// 100 g oats: 370 kcal, 13 g protein, 7 g fat, 10 g fibre, 59 g carbs.
const oats = {
  quantity: "100",
  values: {
    kcal: "370",
    protein: "13",
    fat: "7",
    fibre: "10",
    carbs: "59",
    saturatedFat: "1.2",
  },
};
// 250 g milk: per 100 → 35 kcal, 3.5 g protein, 0.1 fat, 0 fibre, 5 carbs.
const milk = {
  quantity: "250",
  values: {
    kcal: "35",
    protein: "3.5",
    fat: "0.1",
    fibre: "0",
    carbs: "5",
    saturatedFat: "0.1",
  },
};

describe("lineShares (MOD-61)", () => {
  const s = lineShares([oats, milk], null, refs);
  it("each criterion's shares sum to 1, in the lines' order", () => {
    for (const k of ["carbsQuality", "fatQuality", "satiety", "variety", "fit"])
      expect(s[k]!.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });
  it("carbs quality: each line's share of the carbs (59 vs 12,5 g)", () => {
    expect(s["carbsQuality"]![0]).toBeCloseTo(59 / 71.5, 9);
  });
  it("satiety: the mean of its share of protein (13 vs 8,75) and of fibre (10 vs 0)", () => {
    expect(s["satiety"]![0]).toBeCloseTo((13 / 21.75 + 1) / 2, 9);
  });
  it("servings change the amounts, not the shares", () => {
    expect(lineShares([oats, milk], "2", refs)["fatQuality"]).toEqual(s["fatQuality"]);
  });
  it("nothing to split: empty (timing without a moment)", () => {
    expect(s["timing"]).toEqual([]);
  });
});
