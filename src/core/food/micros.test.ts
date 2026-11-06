import { describe, expect, it } from "vitest";
import { dayMicros } from "./micros";

describe("a day's micronutrients", () => {
  it("add each food's estimates per 100 g times the grams and the servings", () => {
    const m = dayMicros([
      {
        servings: "2",
        lines: [
          { quantity: "50", values: {}, estimates: { ca: "120", vitD: "1.5" } },
          { quantity: "100", values: {} },
        ],
      },
      {
        servings: null,
        lines: [{ quantity: "200", values: {}, estimates: { ca: "10" } }],
      },
    ]);
    expect(m).toEqual({ ca: 140, vitD: 1.5 });
  });

  it("take sodium from the line's own salt, not the estimate", () => {
    const m = dayMicros([
      {
        servings: null,
        lines: [{ quantity: "50", values: { salt: "2" }, estimates: { na: "9999" } }],
      },
    ]);
    // 1 g of salt → 400 mg of sodium
    expect(m).toEqual({ na: 400 });
  });
});
