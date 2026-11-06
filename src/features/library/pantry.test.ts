/** Tests for features/library/pantry.ts: the Dispensa's words and typed amounts. */
import { describe, expect, it } from "vitest";
import { stockWords as words, typedAmount, typedCents } from "./pantry";

// F puts no-break spaces between a number and its unit.
const stockWords = (...a: Parameters<typeof words>) => {
  const w = words(...a);
  return { ...w, meta: w.meta.replace(/[\u00a0\u202f]/g, " ") };
};

describe("stockWords", () => {
  it("left, the days and the pace; finished; no use", () => {
    expect(stockWords({ left: "1300", dailyUse: "175", daysLeft: 7 }, "ml").meta).toBe(
      "finisce tra 7 giorni · 175 ml al giorno",
    );
    expect(stockWords({ left: "0", dailyUse: "175", daysLeft: 0 }, "ml").meta).toBe(
      "finito",
    );
    expect(stockWords({ left: "500", dailyUse: null, daysLeft: null }, "g").meta).toBe(
      "non usato nelle ultime 4 settimane",
    );
  });
});

describe("typed amounts", () => {
  it("comma decimals, empty, junk", () => {
    expect(typedAmount("1,5")).toBe("1.5");
    expect(typedAmount(" ")).toBeNull();
    expect(typedAmount("1,5 kg")).toBeNaN();
    expect(typedCents("3,98")).toBe(398);
    expect(typedCents("")).toBeNull();
    expect(typedCents("tre")).toBeNaN();
  });
});
