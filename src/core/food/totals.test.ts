import { describe, expect, it } from "vitest";
import { lineTotals } from "./totals";

describe("a meal's totals", () => {
  it("sums value × quantity / 100 per line, exactly, times the servings", () => {
    const lines = [
      { quantity: "80", values: { kcal: "372", protein: "13.5" } },
      { quantity: "30.5", values: { kcal: "250" } },
    ];
    expect(lineTotals(lines)).toEqual({ kcal: "373.85", protein: "10.8" });
    expect(lineTotals(lines, "0.5")).toEqual({ kcal: "186.925", protein: "5.4" });
  });

  it("is empty with no lines, and never a float error", () => {
    expect(lineTotals([])).toEqual({});
    expect(
      lineTotals([
        { quantity: "10", values: { x: "0.1" } },
        { quantity: "10", values: { x: "0.2" } },
      ]),
    ).toEqual({ x: "0.03" });
  });
});
