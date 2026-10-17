import { describe, expect, it } from "vitest";
import type { Day, DayItem, FoodTargets } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
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
const week: FoodTargets = {
  from: "week",
  since: "2026-10-10",
  kcal: 2778,
  protein: 154,
  carbs: 367,
  fat: 77,
  fibre: 39,
  sugars: 125,
  saturatedFat: 31,
  salt: 5,
};

describe("the day as a Box with Nutrients L1", () => {
  it("adds the meals, eaten and planned, against the week's targets", () => {
    const d = presentDay(
      day(
        [
          item("meal", {
            values: { servings: "2" },
            lines: [line("Avena", "50", { kcal: "372", protein: "13.5", fibre: "10" })],
          }),
          item("meal", {
            status: "planned",
            lines: [line("Latte", "200", { kcal: "46", protein: "3.4", sugars: "4.8" })],
          }),
          item("water", { values: { ml: "500" } }),
        ],
        [
          item("meal", {
            lines: [
              line("Mela", "150", { kcal: "52", sugars: "10.4", saturatedFat: "0" }),
            ],
          }),
        ],
      ),
      week,
    )!;
    expect(d.entry).toEqual({
      fam: "day",
      title: "Il giorno",
      meta: "obiettivi della settimana dal 10 ott",
    });
    expect(d.nutrients.kcal).toEqual({ v: 450, planned: 92, t: 2778 });
    expect(d.nutrients.macros.map((m) => [m.key, m.v, m.planned, m.t])).toEqual([
      ["protein", 13.5, 6.8, 154],
      ["carbs", 0, 0, 367],
      ["fat", 0, 0, 77],
      ["fiber", 10, 0, 39],
    ]);
    expect(d.nutrients.macros[0]!.sources).toEqual([["Avena", 13.5]]);
    expect(d.nutrients.limits).toEqual([
      { key: "sugars", v: 15.6, t: 125 },
      { key: "sat", v: 0, t: 31 },
      { key: "salt", v: 0, t: 5 },
    ]);
  });

  it("leaves out what was left out of the plan, and says when there are no targets", () => {
    const d = presentDay(
      day([
        item("meal", {
          status: "planned",
          values: { leftOut: true },
          lines: [line("Latte", "200", { kcal: "46" })],
        }),
      ]),
      null,
    )!;
    expect(d.entry.meta).toBe("obiettivi non ancora calcolati in v2");
    expect(d.nutrients.kcal).toEqual({ v: 0, planned: 0, t: null });
    expect(d.nutrients.limits).toEqual([]);
  });

  it("is not there on a day with no meals and no targets", () => {
    expect(presentDay(day([item("water")]), null)).toBeNull();
  });
});
