import { describe, expect, it } from "vitest";
import type { NutrientsData } from "@lifeos/kit";
import { period, trainingOf, weightChange } from "./period";

const day = (kcal: number, protein: number, t = 2000): NutrientsData => ({
  kcal: { v: kcal, t },
  macros: [{ key: "protein", v: protein, t: 150 }],
  limits: [{ key: "salt", v: 5, t: 6 }],
});

describe("«Il periodo»", () => {
  it("averages the days with something eaten, and lists every day", () => {
    const p = period([
      { day: "2026-10-15", nutrients: day(2000, 140) },
      { day: "2026-10-16", nutrients: day(0, 0) },
      { day: "2026-10-17", nutrients: day(2400, 160, 2200) },
      { day: "2026-10-18", nutrients: null },
    ]);
    expect(p.logged).toBe(2);
    expect(p.nutrients).toEqual({
      kcal: { v: 2200, t: 2100 },
      macros: [{ key: "protein", v: 150, t: 150 }],
      limits: [{ key: "salt", v: 5, t: 6 }],
    });
    expect(p.rows.map((r) => r.kcal)).toEqual([2000, null, 2400, null]);
    expect(period([{ day: "2026-10-18", nutrients: null }]).nutrients).toBeNull();
  });
});

describe("the period's weight", () => {
  it("compares the first and the last week's means", () => {
    const w = weightChange([
      { day: "2026-09-20", kg: 80 },
      { day: "2026-09-22", kg: 79 },
      { day: "2026-10-14", kg: 78 },
      { day: "2026-10-16", kg: 77 },
    ]);
    expect(w).toEqual({ from: 79.5, to: 77.5, delta: -2, n: 4 });
    expect(weightChange([{ day: "2026-10-16", kg: 77 }])).toBeNull();
  });
});

describe("the period's training", () => {
  it("adds the sessions, sets and minutes, and gives sessions per week", () => {
    const days = Array.from({ length: 14 }, (_, i) =>
      i % 2 === 0
        ? { sessions: 1, workSets: 12, minutes: 60 }
        : { sessions: 0, workSets: 0, minutes: 0 },
    );
    expect(trainingOf(days)).toEqual({
      sessions: 7,
      workSets: 84,
      minutes: 420,
      perWeek: 3.5,
    });
  });
});
