import { describe, expect, it } from "vitest";
import type { PricedDay } from "@/core/energy";
import { burnText, dayBurnLine, rowBurns } from "./burn";

const r = (low: number, high: number) => ({ low, high });
// F joins numbers and units with no-break spaces.
const plain = (s: string | null) => s?.replace(/\u00a0/g, " ") ?? null;
// A day priced like 27 Oct: base, 15 000 steps, the Push (energy-day.md §8).
const day: PricedDay = {
  day: "2026-10-27",
  feet: { hours: 3.5, source: "median" },
  sessions: [{ id: "push", prior: r(254, 377), tail: r(20, 40) }],
  prior: {
    bmr: 1800,
    baseline: r(2115, 2313),
    tef: r(180, 220),
    steps: r(452, 598),
    training: r(274, 417),
    total: r(2841, 3328),
  },
};

describe("burnText", () => {
  it("rounds a range to 10 kcal", () => {
    expect(plain(burnText(r(254, 377)))).toBe("≈ 250–380 kcal");
  });
  it("says nothing under 10 kcal or without a range", () => {
    expect(burnText(r(0, 4))).toBeNull();
    expect(burnText(null)).toBeNull();
  });
});

describe("rowBurns", () => {
  it("prices each session by id and the steps under «steps»", () => {
    const m = rowBurns(day);
    expect(m.get("push")).toEqual(r(254, 377));
    expect(m.get("steps")).toEqual(r(452, 598));
  });
});

describe("dayBurnLine", () => {
  it("a past day: its total and the hours on feet, marked as an estimate", () => {
    expect(plain(dayBurnLine(day, null))).toBe(
      "Speso ≈ 2.840–3.330 kcal · 3,5 h in piedi (stima), per lo più seduto",
    );
  });
  it("today at noon: half the everyday part plus what was done, then the whole day", () => {
    // 0.5 × (2115–2313) + steps + training = 1783.5–2171.5
    expect(plain(dayBurnLine(day, 0.5))).toBe(
      "Speso finora ≈ 1.780–2.170 kcal · a fine giornata ≈ 2.840–3.330 kcal · 3,5 h in piedi (stima), per lo più seduto",
    );
  });
});
