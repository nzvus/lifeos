import { describe, expect, it } from "vitest";
import { brandMean, pastTolerance } from "./brands";

describe("a food's brands, averaged by his use (objects.md §8 test 3)", () => {
  it("100 kcal eaten 30 times and 120 eaten 10 → 105, spread 100–120", () => {
    const m = brandMean([
      { per100: { kcal: "100", protein: "5" }, uses: 30 },
      { per100: { kcal: "120", protein: "5" }, uses: 10 },
    ]);
    expect(m?.per100).toEqual({ kcal: "105", protein: "5" });
    expect(m?.spread).toEqual({ kcal: [100, 120] });
    expect(m?.uncertain).toEqual([]);
  });

  it("a never-eaten brand counts once; a field only some brands give is their mean", () => {
    const m = brandMean([
      { per100: { kcal: "100", salt: "1" }, uses: 0 },
      { per100: { kcal: "200" }, uses: 0 },
    ]);
    expect(m?.per100).toEqual({ kcal: "150", salt: "1" });
  });

  it("past the EU label tolerance the field is uncertain", () => {
    expect(pastTolerance("protein", 5, 8)).toBe(false); // ±2 g each side under 10 g
    expect(pastTolerance("protein", 5, 10)).toBe(true);
    expect(pastTolerance("fat", 20, 28)).toBe(false); // ±20 % of 24
    expect(pastTolerance("kcal", 100, 160)).toBe(true);
    expect(brandMean([])).toBeNull();
  });
});
