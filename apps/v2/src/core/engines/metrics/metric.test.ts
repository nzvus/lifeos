import { describe, expect, it } from "vitest";
import { custom } from "../time/window";
import type { MetricDefinition, MetricEntry } from "./metric";
import { metric } from "./metric";

let n = 0;
const meal = (
  day: string,
  minute: number | undefined,
  values: MetricEntry["values"],
  more: Partial<MetricEntry> = {},
): MetricEntry => ({
  id: `m${++n}`,
  kind: "meal",
  day,
  minute,
  status: "done",
  values,
  ...more,
});

const first = <T>(xs: T[]): T => xs[0]!;

const values = (points: ReturnType<typeof metric>) =>
  points.map((p) => (p.value.known ? p.value.value : null));

const proteinPerDay: MetricDefinition = {
  source: { kind: "meal", field: "protein" },
  aggregate: { type: "sum" },
  per: "day",
};

describe("metric: sums per day", () => {
  const entries = [
    meal("2026-10-12", 480, { protein: "30.1" }),
    meal("2026-10-12", 780, { protein: "40.2" }),
    meal("2026-10-14", 800, { protein: 55 }),
  ];
  it("adds exactly, and an unlogged day is unknown, never zero", () => {
    const w = custom("2026-10-12", "2026-10-14");
    expect(values(metric(entries, proteinPerDay, w))).toEqual(["70.3", null, "55"]);
  });
  it("planned and skipped entries count only when asked: the day with the plan", () => {
    const plan = [
      meal("2026-10-12", 480, { protein: 30 }),
      meal("2026-10-12", 1200, { protein: 50 }, { status: "planned" }),
      meal("2026-10-12", 780, { protein: 99 }, { status: "skipped" }),
    ];
    const w = custom("2026-10-12", "2026-10-12");
    expect(values(metric(plan, proteinPerDay, w))).toEqual(["30"]);
    const withPlan = {
      ...proteinPerDay,
      filter: { status: ["done", "planned"] as const },
    };
    expect(values(metric(plan, withPlan, w))).toEqual(["80"]);
  });
  it("a day holding only a skipped meal has no data", () => {
    const w = custom("2026-10-12", "2026-10-12");
    const skipped = [meal("2026-10-12", 780, { protein: 40 }, { status: "skipped" })];
    expect(metric(skipped, proteinPerDay, w)[0]!.value).toEqual({ known: false });
  });
});

describe("metric: filters", () => {
  // Day boundary 04:00: the 01:30 snack has minute 90 and belongs to the 12th.
  const entries = [
    meal("2026-10-12", 780, { kcal: 700 }),
    meal("2026-10-12", 1290, { kcal: 300 }),
    meal("2026-10-12", 90, { kcal: 200 }),
    meal("2026-10-13", 780, { kcal: 900 }),
    meal("2026-10-13", undefined, { kcal: 100 }),
  ];
  const late = { minutes: { from: 1260, to: 239 } };
  const w = custom("2026-10-12", "2026-10-13");
  it("time of day wraps past midnight; a logged day with nothing late is 0, not unknown", () => {
    const def: MetricDefinition = {
      source: { kind: "meal", field: "kcal" },
      filter: late,
      aggregate: { type: "sum" },
      per: "day",
    };
    expect(values(metric(entries, def, w))).toEqual(["500", "0"]);
  });
  it("share: kcal after 21:00 out of the day's kcal", () => {
    const def: MetricDefinition = {
      source: { kind: "meal", field: "kcal" },
      aggregate: { type: "share", part: late },
      per: "day",
    };
    expect(values(metric(entries, def, w))).toEqual(["0.41666666666666666667", "0"]);
  });
  it("by relation tag and catalog item, counted", () => {
    const tagged = [
      meal("2026-10-12", 600, {}, { tags: ["post-workout"], item: "oats" }),
      meal("2026-10-12", 900, {}, { item: "oats" }),
      meal("2026-10-12", 1200, {}, { tags: ["post-workout"] }),
    ];
    const count = (filter: MetricDefinition["filter"]): MetricDefinition => ({
      source: { kind: "meal" },
      filter,
      aggregate: { type: "count" },
      per: "window",
    });
    const d = custom("2026-10-12", "2026-10-12");
    expect(values(metric(tagged, count({ tag: "post-workout" }), d))).toEqual(["2"]);
    expect(values(metric(tagged, count({ item: "oats" }), d))).toEqual(["2"]);
  });
});

describe("metric: buckets", () => {
  const set = (day: string, muscle: string): MetricEntry => ({
    id: `s${++n}`,
    kind: "set",
    day,
    status: "done",
    values: {},
    item: muscle,
  });
  it("weeks are ISO weeks clipped to the window; days/of count the clipped days", () => {
    const sets = [
      set("2026-10-11", "chest"),
      set("2026-10-12", "chest"),
      set("2026-10-15", "chest"),
    ];
    const def: MetricDefinition = {
      source: { kind: "set" },
      filter: { item: "chest" },
      aggregate: { type: "count" },
      per: "week",
    };
    // Sat 10 → Tue 20 October: Sat–Sun, then Mon 12–Sun 18, then Mon–Tue.
    const points = metric(sets, def, custom("2026-10-10", "2026-10-20"));
    expect(points.map((p) => p.window)).toEqual([
      { from: "2026-10-10", to: "2026-10-11" },
      { from: "2026-10-12", to: "2026-10-18" },
      { from: "2026-10-19", to: "2026-10-20" },
    ]);
    expect(points.map((p) => p.value)).toEqual([
      { known: true, value: "1", days: 1, of: 2 },
      { known: true, value: "2", days: 2, of: 7 },
      { known: false },
    ]);
  });
  it("months follow the calendar", () => {
    const def: MetricDefinition = {
      source: { kind: "set" },
      aggregate: { type: "count" },
      per: "month",
    };
    const points = metric(
      [set("2026-09-30", "back")],
      def,
      custom("2026-09-29", "2026-10-02"),
    );
    expect(points.map((p) => [p.window.from, p.window.to])).toEqual([
      ["2026-09-29", "2026-09-30"],
      ["2026-10-01", "2026-10-02"],
    ]);
  });
});

describe("metric: a metric of a per-day metric", () => {
  const entries = [
    meal("2026-10-12", 480, { protein: 100 }),
    meal("2026-10-13", 480, { protein: 140 }),
    meal("2026-10-13", 780, { protein: 0 }),
  ];
  it("the week's mean daily protein leaves the unlogged days out", () => {
    const def: MetricDefinition = {
      source: { metric: proteinPerDay },
      aggregate: { type: "mean" },
      per: "week",
    };
    const p = first(metric(entries, def, custom("2026-10-12", "2026-10-18")));
    expect(p.value).toEqual({ known: true, value: "120", days: 2, of: 7 });
  });
  it("first and last of a per-day metric follow the days", () => {
    const def = (type: "first" | "last"): MetricDefinition => ({
      source: { metric: proteinPerDay },
      aggregate: { type },
      per: "window",
    });
    const w = custom("2026-10-12", "2026-10-18");
    expect(values(metric(entries, def("first"), w))).toEqual(["100"]);
    expect(values(metric(entries, def("last"), w))).toEqual(["140"]);
  });
  it("only a per-day metric can be the source", () => {
    const def: MetricDefinition = {
      source: { metric: { ...proteinPerDay, per: "week" } },
      aggregate: { type: "mean" },
      per: "month",
    };
    expect(() => metric(entries, def, custom("2026-10-12", "2026-10-18"))).toThrow(
      RangeError,
    );
  });
});

describe("metric: other aggregates", () => {
  it("min, max, first and last; an unknown time sits at the end of its day", () => {
    const entries = [
      meal("2026-10-12", undefined, { kcal: "250.5" }),
      meal("2026-10-12", 480, { kcal: "400" }),
      meal("2026-10-12", 780, { kcal: "100" }),
    ];
    const w = custom("2026-10-12", "2026-10-12");
    const of = (type: "min" | "max" | "first" | "last"): MetricDefinition => ({
      source: { kind: "meal", field: "kcal" },
      aggregate: { type },
      per: "window",
    });
    expect(values(metric(entries, of("min"), w))).toEqual(["100"]);
    expect(values(metric(entries, of("max"), w))).toEqual(["400"]);
    expect(values(metric(entries, of("first"), w))).toEqual(["400"]);
    expect(values(metric(entries, of("last"), w))).toEqual(["250.5"]);
  });
  it("sleep regularity over 7 days: the circular spread of bedtimes", () => {
    const sleep = (day: string, minute: number): MetricEntry => ({
      id: `z${++n}`,
      kind: "sleep",
      day,
      minute,
      status: "done",
      values: {},
    });
    // 23:30, 00:30, 23:30, 00:30: a 30-minute spread around midnight, not 23 hours.
    const nights = [
      sleep("2026-10-12", 1410),
      sleep("2026-10-13", 30),
      sleep("2026-10-14", 1410),
      sleep("2026-10-15", 30),
    ];
    const def: MetricDefinition = {
      source: { kind: "sleep" },
      aggregate: { type: "timeSpread" },
      per: "window",
    };
    const p = first(metric(nights, def, custom("2026-10-12", "2026-10-18")));
    expect(p.value.known && Number(p.value.value)).toBeCloseTo(30, 0);
  });
  it("regularity of daily steps reads the per-day values", () => {
    const steps = ["7000", "14000", "16500", "13000"].map((v, i) => ({
      id: `p${i}`,
      kind: "steps",
      day: `2026-10-1${2 + i}`,
      status: "done" as const,
      values: { steps: v },
    }));
    const def: MetricDefinition = {
      source: {
        metric: {
          source: { kind: "steps", field: "steps" },
          aggregate: { type: "sum" },
          per: "day",
        },
      },
      aggregate: { type: "regularity" },
      per: "window",
    };
    const p = first(metric(steps, def, custom("2026-10-12", "2026-10-18")));
    expect(p.value.known && Number(p.value.value)).toBeCloseTo(0.724, 3);
  });
  it("a mean of nothing is unknown, not zero", () => {
    const def: MetricDefinition = {
      source: { kind: "meal", field: "kcal" },
      filter: { item: "none" },
      aggregate: { type: "mean" },
      per: "window",
    };
    const w = custom("2026-10-12", "2026-10-12");
    expect(metric([meal("2026-10-12", 480, { kcal: 1 })], def, w)[0]!.value).toEqual({
      known: false,
    });
  });
});

describe("metric: transforms", () => {
  const entries = [
    meal("2026-10-12", 480, { protein: 150, kcal: 2500 }),
    meal("2026-10-13", 480, { protein: 120, kcal: 0 }),
  ];
  const w = custom("2026-10-12", "2026-10-14");
  it("per kg divides by the trend weight of the day, never a single weigh-in", () => {
    const weightKg = new Map([
      ["2026-10-12", "75"],
      ["2026-10-14", "74.8"],
    ]);
    const def: MetricDefinition = {
      ...proteinPerDay,
      transform: { type: "perKg", weightKg },
    };
    // The 13th has protein but no trend weight: unknown. The 14th has a weight but no meals.
    expect(values(metric(entries, def, w))).toEqual(["2", null, null]);
  });
  it("per kg over a week uses the week's mean trend weight", () => {
    const weightKg = new Map([
      ["2026-10-12", 76],
      ["2026-10-13", 74],
    ]);
    const def: MetricDefinition = {
      ...proteinPerDay,
      per: "window",
      transform: { type: "perKg", weightKg },
    };
    expect(values(metric(entries, def, w))).toEqual(["3.6"]);
  });
  it("ratio: protein over kcal on the same bucket; a zero denominator is unknown", () => {
    const def: MetricDefinition = {
      ...proteinPerDay,
      transform: {
        type: "ratio",
        denominator: {
          source: { kind: "meal", field: "kcal" },
          aggregate: { type: "sum" },
          per: "day",
        },
      },
    };
    expect(values(metric(entries, def, w))).toEqual(["0.06", null, null]);
  });
});
