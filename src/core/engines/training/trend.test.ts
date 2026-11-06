import { describe, expect, it } from "vitest";
import { exerciseTrend, TE_PRIOR, trendWindow } from "./trend";
import { ols } from "./stats";

// The developer's best e1RM per session (refined export of 16 Oct, dossiers/training.md §8).
const chestPress = [
  { day: "2026-05-28", value: 73.3 },
  { day: "2026-09-11", value: 63.3 },
  { day: "2026-09-19", value: 69.7 },
  { day: "2026-09-23", value: 80 },
  { day: "2026-09-30", value: 80 },
  { day: "2026-10-04", value: 80 },
  { day: "2026-10-06", value: 86.7 },
  { day: "2026-10-10", value: 80 },
  { day: "2026-10-15", value: 78 },
];
// Lat pulldown with the hard sets done before it for the same muscles (≈ 3 a place).
const latPulldown = [
  { day: "2026-05-29", value: 60, before: 0 },
  { day: "2026-09-15", value: 44.3, before: 9 },
  { day: "2026-09-21", value: 53.3, before: 0 },
  { day: "2026-09-27", value: 53.3, before: 0 },
  { day: "2026-09-28", value: 53.3, before: 0 },
  { day: "2026-10-02", value: 50.7, before: 0 },
  { day: "2026-10-05", value: 50.7, before: 6 },
  { day: "2026-10-08", value: 53.3, before: 0 },
  { day: "2026-10-13", value: 54.7, before: 0 },
];

describe("least squares", () => {
  it("fits a line and a plane exactly, and refuses too few rows", () => {
    expect(
      ols([
        { y: 1, x: [0] },
        { y: 3, x: [1] },
        { y: 5, x: [2] },
      ])!.coef,
    ).toEqual([1, 2]);
    const plane = ols(
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ].map(([a, b]) => ({ y: 10 + 2 * a! - 3 * b!, x: [a!, b!] })),
    )!;
    expect(plane.coef.map((c) => Math.round(c * 1e6) / 1e6)).toEqual([10, 2, -3]);
    expect(
      ols([
        { y: 1, x: [0] },
        { y: 2, x: [1] },
      ]),
    ).toBeNull();
  });
});

describe("an exercise's trend", () => {
  it("restarts after a break of more than 21 days (May → Sep)", () => {
    expect(trendWindow(chestPress)[0]!.day).toBe("2026-09-11");
  });

  it("reads the chest press as rising, not as the last session's −2.5 %", () => {
    const t = exerciseTrend(chestPress);
    expect(t.state).toBe("rising");
    if (t.state === "few") return;
    expect(t.since).toBe("2026-09-11");
    expect(t.n).toBe(8);
    expect(t.teOwn).toBe(true);
    expect(t.perMonthPct).toBeGreaterThan(5);
  });

  it("learns the order: the lat pulldown done later is lower, not a regression", () => {
    const t = exerciseTrend(latPulldown);
    if (t.state === "few") throw new Error("few");
    expect(t.n).toBe(8);
    expect(t.orderPctPerSet).not.toBeNull();
    expect(t.orderPctPerSet!).toBeLessThan(0);
    // Read at its usual place (first), the level sits near the sessions done first.
    expect(t.level).toBeGreaterThan(52);
  });

  it("says «stabile» when the change is inside the noise", () => {
    const t = exerciseTrend([
      { day: "2026-10-01", value: 50 },
      { day: "2026-10-04", value: 53 },
      { day: "2026-10-08", value: 48 },
      { day: "2026-10-11", value: 52 },
      { day: "2026-10-15", value: 50.5 },
    ]);
    expect(t.state).toBe("stable");
  });

  it("needs 3 sessions; with fewer than 5 the noise is the prior", () => {
    expect(exerciseTrend(chestPress.slice(0, 3)).state).toBe("few");
    const t = exerciseTrend([
      { day: "2026-10-01", value: 40 },
      { day: "2026-10-08", value: 44 },
      { day: "2026-10-15", value: 48 },
    ]);
    if (t.state === "few") throw new Error("few");
    expect(t.te).toBe(TE_PRIOR);
    expect(t.teOwn).toBe(false);
    expect(t.state).toBe("rising");
  });
});
