import { describe, expect, it } from "vitest";
import type { Day, DayItem, FoodTargets } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import {
  dayScore,
  habitsPart,
  presentWeek,
  targetsPart,
  weekScores,
  weightOn,
} from "./day-score";
import { presentDay } from "./nutrients";

const reg = kindRegistry();
const item = (kind: string, over: Partial<DayItem> = {}): DayItem => ({
  id: "x",
  kind: reg.get(kind),
  family: reg.get(kind).family,
  subcategory: null,
  status: "done",
  start: null,
  end: null,
  minute: null,
  item: null,
  values: {},
  lines: [],
  children: [],
  sets: [],
  money: null,
  fulfils: null,
  tags: [],
  source: "import",
  confidence: "1",
  note: "",
  ...over,
});
const line = (name: string, quantity: string, values: Record<string, string>) => ({
  id: name,
  name,
  itemId: null,
  productId: null,
  quantity,
  unit: "g",
  values,
});
const day = (timed: DayItem[], untimed: DayItem[] = []): Day => ({
  day: "2026-10-15",
  clock: { timeZone: "Europe/Rome", boundaryMin: 240 },
  timed,
  untimed,
  invalidKinds: [],
});

// A day of the developer's size: 2 200 kcal, 146 g protein, 7.2 g salt.
const food = item("meal", {
  lines: [
    line("Giorno", "100", {
      kcal: "2198",
      protein: "146",
      carbs: "300.8",
      fat: "38",
      fibre: "30.3",
      saturatedFat: "10.1",
      salt: "7.2",
    }),
  ],
});
const n = (d: Day, t: FoodTargets | null = null) =>
  presentDay(d, t, new Map(), null, 75.6)?.nutrients ?? null;

describe("the day's score (dossiers/ranges.md §5)", () => {
  it("dayTargets: the mean of each number's zone score", () => {
    const part = targetsPart(n(day([food])), false)!;
    // protein, carbs good (1); fat 38 g fair under 48.8; fibre fair under 30.8;
    // sugars (total, no zones) left out; saturated good; salt fair over 5.
    // (1 + 1 + 0.557 + 0.973 + 1 + 0.56) / 6
    expect(part).toBeCloseTo(0.848, 2);
    expect(targetsPart(n(day([])), false)).toBeNull();
  });

  it("a day still going is not judged for what it has yet to reach", () => {
    const little = item("meal", {
      lines: [line("Pane", "100", { kcal: "270", protein: "9" })],
    });
    expect(targetsPart(n(day([little])), true)).toBe(1);
    expect(targetsPart(n(day([little])), false)).toBeLessThan(0.6);
  });

  it("habits: of what was planned, the share done; a day going counts what is due", () => {
    const steps = item("activity", { status: "done", source: "template", minute: 600 });
    const skipped = item("activity", { status: "skipped", minute: 700 });
    const later = item("activity", { status: "planned", minute: 1200 });
    const unplanned = item("activity", { status: "done", minute: 800 });
    const all = [steps, skipped, later, unplanned];
    expect(habitsPart(all, null)).toBeCloseTo(1 / 3);
    expect(habitsPart(all, 900)).toBe(0.5);
    expect(habitsPart([unplanned], null)).toBeNull();
    // A planned meal left over (v1 logged the eaten one apart): not a habit.
    expect(habitsPart([item("meal", { status: "planned" }), steps], null)).toBe(1);
  });

  it("weighs the parts 45/35/20 and names what is missing", () => {
    const s = dayScore({
      day: day([food]),
      nutrients: n(day([food])),
      night: 82,
      now: null,
    })!;
    expect(s.parts.map((p) => p.name)).toEqual(["obiettivi del giorno", "recupero"]);
    expect(s.missing).toEqual(["abitudini"]);
    expect(s.parts[1]!.weight).toBeCloseTo(35 / 80);
  });

  it("the week strip: a score for each day up to today", () => {
    const d = (iso: string, timed: DayItem[]) => ({ ...day(timed), day: iso });
    const days = [d("2026-10-19", [food]), d("2026-10-20", []), d("2026-10-26", [food])];
    const scores = weekScores({
      days,
      present: presentWeek({
        days,
        targets: new Map(),
        estimates: new Map(),
        micros: null,
        weighings: [{ day: "2026-10-19", kg: 75.6 }],
      }),
      ctx: {
        date: "2026-10-19",
        clock: { timeZone: "Europe/Rome", boundaryMin: 0 },
        weighings: null,
        weightGoal: null,
        nights: [],
        sex: null,
        now: null,
      },
      today: "2026-10-24",
      nowMinute: 600,
    });
    expect(Object.keys(scores)).toEqual(["2026-10-19"]);
  });

  it("the reference weight: the mean of the 7 days up to the day", () => {
    const ws = [
      { day: "2026-10-10", kg: 80 },
      { day: "2026-10-18", kg: 76 },
      { day: "2026-10-20", kg: 75 },
    ];
    expect(weightOn(ws, "2026-10-20")).toBe(75.5);
    expect(weightOn(ws, "2026-10-09")).toBeNull();
  });

  it("limits carry the week's mean up to each day, and the score reads it", () => {
    const d = (iso: string, salt: string) => ({
      ...day([item("meal", { lines: [line("X", "100", { kcal: "2000", salt })] })]),
      day: iso,
    });
    const days = [d("2026-10-19", "4"), d("2026-10-20", "4"), d("2026-10-21", "11")];
    const w = presentWeek({
      days,
      targets: new Map(),
      estimates: new Map(),
      micros: null,
      weighings: [],
    });
    const salt = (iso: string) =>
      w.get(iso)!.nutrients.limits!.find((l) => l.key === "salt")!;
    expect(salt("2026-10-19").mean).toBeUndefined();
    expect(salt("2026-10-21")).toMatchObject({ v: 11, mean: 19 / 3, meanDays: 3 });
  });

  it("a day still going is judged with what is planned for the rest of it", () => {
    const lunch = item("meal", {
      lines: [line("Pane", "100", { kcal: "900", salt: "4" })],
    });
    const dinner = item("meal", {
      status: "planned",
      lines: [line("Pizza", "100", { kcal: "1300", salt: "5" })],
    });
    const nn = n(day([lunch, dinner]))!;
    expect(nn.limits!.find((l) => l.key === "salt")).toMatchObject({ v: 4, planned: 5 });
    // 9 g of salt with the pizza: over 7.5, bad; the day so far alone would be fine.
    expect(targetsPart(nn, true)!).toBeLessThan(targetsPart(n(day([lunch])), true)!);
  });
});
