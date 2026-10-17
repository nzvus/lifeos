import { describe, expect, it } from "vitest";
import { addDays } from "../time/date";
import { custom } from "../time/window";
import type { MetricEntry } from "./metric";
import { metric } from "./metric";
import { perSession, ratePerWeek, toSeries, trend } from "./series";

let n = 0;
const set = (day: string, session: string, e1rm: number): MetricEntry => ({
  id: `s${++n}`,
  kind: "set",
  day,
  status: "done",
  values: { e1rm },
  parent: session,
  item: "squat",
});

describe("per session", () => {
  it("e1RM best per session, two sessions on one day kept apart", () => {
    const entries = [
      set("2026-10-12", "a", 120),
      set("2026-10-12", "a", 124.5),
      set("2026-10-12", "b", 118),
      set("2026-10-15", "c", 126),
      set("2026-10-30", "d", 200), // outside the window
    ];
    const points = perSession(
      entries,
      {
        source: { kind: "set", field: "e1rm" },
        filter: { item: "squat" },
        aggregate: { type: "max" },
      },
      custom("2026-10-10", "2026-10-20"),
    );
    expect(
      points.map((p) => [p.session, p.window.from, p.value.known && p.value.value]),
    ).toEqual([
      ["a", "2026-10-12", "124.5"],
      ["b", "2026-10-12", "118"],
      ["c", "2026-10-15", "126"],
    ]);
  });
});

describe("trend", () => {
  it("follows a step with its half-life, and σ grows with the surprise", () => {
    const s = [0, 1, 2, 3].map((i) => ({
      day: addDays("2026-10-01", i),
      value: i < 2 ? 10 : 20,
    }));
    const t = trend(s, 1);
    expect(t.map((p) => p.trend)).toEqual([10, 10, 15, 17.5]);
    expect(t[1]!.sigma).toBe(0);
    expect(t[2]!.sigma).toBeGreaterThan(0);
  });
  it("a point after a gap pulls more than one the day after", () => {
    const near = trend(
      [
        { day: "2026-10-01", value: 10 },
        { day: "2026-10-02", value: 20 },
      ],
      7,
    );
    const far = trend(
      [
        { day: "2026-10-01", value: 10 },
        { day: "2026-10-15", value: 20 },
      ],
      7,
    );
    expect(far[1]!.trend).toBeGreaterThan(near[1]!.trend);
    expect(far[1]!.trend).toBeCloseTo(17.5, 6); // two half-lives: 75 % of the way
  });
  it("needs a positive half-life", () => {
    expect(() => trend([], 0)).toThrow(RangeError);
  });
});

describe("rate per week", () => {
  it("the slope of the known points × 7, from a metric's series", () => {
    const steps = [0, 1, 2, 3, 5].map((i) => ({
      id: `p${i}`,
      kind: "steps",
      day: addDays("2026-10-01", i),
      status: "done" as const,
      values: { n: 8000 + i * 100 },
    }));
    const points = metric(
      steps,
      { source: { kind: "steps", field: "n" }, aggregate: { type: "sum" }, per: "day" },
      custom("2026-10-01", "2026-10-06"),
    );
    const series = toSeries(points);
    expect(series).toHaveLength(5); // 10-05 has no entry: unknown, left out
    expect(ratePerWeek(series)).toBeCloseTo(700, 6);
    expect(ratePerWeek(series.slice(0, 1))).toBeNull();
  });
});
