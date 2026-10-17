import { describe, expect, it } from "vitest";
import { addDays } from "../time/date";
import { correlate, MIN_PAIRS, pairs, ranks, spearman } from "./correlations";

const FROM = "2026-09-01";
const series = (f: (i: number) => number | null, n = 30) =>
  new Map(
    Array.from({ length: n }, (_, i) => [addDays(FROM, i), f(i)] as const).filter(
      (e): e is readonly [string, number] => e[1] !== null,
    ),
  );

describe("E8: Spearman", () => {
  it("ranks share ties; ρ is 1 for any increasing relation, −1 decreasing", () => {
    expect(ranks([10, 20, 20, 5])).toEqual([2, 3.5, 3.5, 1]);
    expect(spearman([1, 2, 3, 4, 5], [1, 4, 9, 16, 25])).toBeCloseTo(1, 10);
    expect(spearman([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 10);
    expect(spearman([1, 1, 1], [1, 2, 3])).toBeNull();
  });
  it("pairs day by day, with a lag; days missing either side are left out", () => {
    const x = series((i) => (i === 3 ? null : i), 5);
    const y = series((i) => i * 10, 6);
    expect(pairs(x, y)).toEqual({ x: [0, 1, 2, 4], y: [0, 10, 20, 40] });
    expect(pairs(x, y, 1)).toEqual({ x: [0, 1, 2, 4], y: [10, 20, 30, 50] });
  });
});

describe("E8: correlate", () => {
  // Caffeine after 14:00 (mg) against the night's sleep (h): more coffee, less sleep, with noise.
  const noise = (i: number) => ((i * 37) % 11) / 11 - 0.5;
  const caffeine = series((i) => (i % 5) * 50);
  const sleep = series((i) => 8 - (i % 5) * 0.3 + noise(i) * 0.6);
  it("needs 21 paired days", () => {
    expect(
      correlate({
        x: { key: "c", byDay: series((i) => i, MIN_PAIRS - 1) },
        y: { key: "s", byDay: sleep },
      }),
    ).toBeNull();
  });
  it("a clear relation, with an interval that does not cross 0; the same on every read", () => {
    const c = correlate({
      x: { key: "caffeine", byDay: caffeine },
      y: { key: "sleep", byDay: sleep },
    })!;
    expect(c.n).toBe(30);
    expect(c.rho).toBeLessThan(-0.7);
    expect(c.high).toBeLessThan(0);
    expect(c.mayBeChance).toBe(false);
    expect(
      correlate({
        x: { key: "caffeine", byDay: caffeine },
        y: { key: "sleep", byDay: sleep },
      }),
    ).toEqual(c);
  });
  it("noise: may be chance", () => {
    const a = series((i) => (i * 7919) % 13);
    const b = series((i) => (i * 104729) % 17);
    expect(
      correlate({ x: { key: "a", byDay: a }, y: { key: "b", byDay: b } })!.mayBeChance,
    ).toBe(true);
  });
  it("a lagged pair reads y the days after", () => {
    const today = series((i) => i % 4);
    const tomorrow = series((i) => (((i - 1) % 4) + 4) % 4, 31);
    expect(
      correlate({
        x: { key: "x", byDay: today },
        y: { key: "y", byDay: tomorrow },
        lag: 1,
      })!.rho,
    ).toBeCloseTo(1, 10);
  });
});
