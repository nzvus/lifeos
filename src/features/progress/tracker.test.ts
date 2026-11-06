import { describe, expect, it } from "vitest";
import type { Day, DayItem } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import type { ScoreContext } from "@/features/day/score";
import {
  kindTracker,
  sleepTracker,
  smoothWeight,
  stepsTracker,
  waterTracker,
  weightTracker,
} from "./tracker";

const reg = kindRegistry();
const item = (kind: string, more: Partial<DayItem> = {}): DayItem =>
  ({
    id: kind + Math.random(),
    kind: reg.get(kind),
    family: "body",
    subcategory: null,
    status: "done",
    start: null,
    end: null,
    minute: 7 * 60,
    item: null,
    values: {},
    lines: [],
    children: [],
    sets: [],
    money: null,
    fulfils: null,
    tags: [],
    source: "typed",
    confidence: "1",
    note: "",
    ...more,
  }) as DayItem;
const clock = { timeZone: "Europe/Rome", boundaryMin: 240 };
const day = (iso: string, timed: DayItem[]): Day => ({
  day: iso,
  clock,
  timed,
  untimed: [],
  invalidKinds: [],
});
const ctxOf = (d: string): ScoreContext => ({
  date: d,
  clock,
  weighings: [
    { day: "2026-10-20", kg: 76 },
    { day: "2026-10-21", kg: 75.6 },
  ],
  weightGoal: null,
  nights: [],
  sex: "male",
  now: null,
});
const period = ["2026-10-20", "2026-10-21"];

describe("a tracker page", () => {
  it("smooths the weight as the board does: fasted weighings move it more", () => {
    expect(
      smoothWeight([
        { kg: 76, fasted: true },
        { kg: 75, fasted: true },
        { kg: 77, fasted: false },
      ]),
    ).toEqual([76, 75.65, 75.85]);
  });

  it("weight: the period's trend, its stats, one row per weighing, newest first", () => {
    const v = weightTracker({
      days: [
        day("2026-10-20", [
          item("weigh_in", { values: { weightKg: "76", fasted: true } }),
        ]),
        day("2026-10-21", [
          item("weigh_in", { values: { weightKg: "75.6", fasted: true } }),
        ]),
      ],
      ctxOf,
      progress: null,
      goal: { value: 72.3, by: "2026-12-20" },
      energy: { kcal: 2650, sigma: 120, loggedDays: 40 },
    });
    expect(v.head.value).toBe("75,9\u00a0kg");
    expect(v.head.pills?.[0]?.t).toBe("2 su 2 a digiuno");
    expect(v.stats.map((s) => s.l)).toEqual(["Trend", "Pesate", "Variazione"]);
    expect(v.rows.map((r) => r.title)).toEqual(["Mercoledì 21", "Martedì 20"]);
    expect(v.chart?.data.goalText).toBe("obiettivo 72,3 · 20 dic ↓ fuori scala");
    expect(v.about).toContain("Consumi ≈ 2.650 ± 120\u00a0kcal");
  });

  it("sleep: bars against 7–9 h, short nights counted", () => {
    const night = (iso: string, h: number) =>
      item("sleep", {
        start: new Date(Date.parse(iso + "T07:00:00+02:00") - h * 3_600_000),
        end: new Date(iso + "T07:00:00+02:00"),
      });
    const v = sleepTracker({
      days: [
        day("2026-10-20", [night("2026-10-20", 6.5)]),
        day("2026-10-21", [night("2026-10-21", 8)]),
      ],
      period,
      ctxOf,
      timeZone: "Europe/Rome",
    });
    expect(v.chart?.data.y).toEqual([6.5, 8]);
    expect(v.head.pills?.[0]?.t).toBe("1 sotto le 7 h");
    expect(v.rows[1]?.meta).toBe("a letto 00:30 · sveglia 07:00");
  });

  it("water: the days logged against their need", () => {
    const v = waterTracker({
      days: [day("2026-10-21", [item("water", { values: { ml: "2000" } })])],
      period,
      ctxOf,
    });
    expect(v.chart?.data.y).toEqual([0, 2]);
    expect(v.stats[0]).toEqual({ l: "Media", v: "2", u: "litri al giorno" });
    expect(v.rows[0]?.href).toBe("/oggi/2026-10-21");
  });

  it("steps: the days at the goal, no score", () => {
    const v = stepsTracker({
      days: [
        day("2026-10-20", [item("steps", { values: { steps: "9000" } })]),
        day("2026-10-21", [item("steps", { values: { steps: "4000" } })]),
      ],
      period,
      goal: { value: 8000, weekdaysOnly: false },
    });
    expect(v.head.score).toBeUndefined();
    expect(v.stats[1]).toMatchObject({ v: "1 su 2" });
    expect(v.chart?.data.bandLo).toBe(8000);
  });

  it("a kind of the person's own: its first number summed per day, its rows as on Oggi", () => {
    const mine = kindRegistry([
      {
        key: "lettura_libera",
        name: "Lettura libera",
        domain: "mind",
        shape: "instant",
        entryMode: "form",
        archivedAt: null,
        definition: {
          family: "mind",
          fields: [{ key: "pagine", label: "Pagine", type: "integer", unit: "pagine" }],
        },
      },
    ]).get("lettura_libera");
    const read = (n: string) =>
      item("chore", { kind: mine, family: "mind", values: { pagine: n } });
    const v = kindTracker({
      kind: mine,
      days: [day("2026-10-20", [read("10"), read("5")]), day("2026-10-21", [read("20")])],
      period,
    });
    expect(v.title).toBe("Lettura libera");
    expect(v.chart?.data.y).toEqual([15, 20]);
    expect(v.head.value).toBe("35\u00a0pagine");
    expect(v.rows.map((r) => r.title)).toEqual([
      "Mercoledì 21",
      "Martedì 20",
      "Martedì 20",
    ]);
  });
});
