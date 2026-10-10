/** A check-in week shifted by day (ADR-0044). */
import { describe, expect, it } from "vitest";
import { floorShifts, shiftDay, weekShifts } from "./shift";

const week = (shifts: number[]) =>
  shifts.map((shiftKcal, i) => ({ day: `2026-10-${12 + i}`, shiftKcal }));

describe("weekShifts", () => {
  it("keeps the week's total: two leg days at +300, five rest days", () => {
    // Mean 600 ÷ 7 = 85.7: legs +214, rest −86; that sums to −2, so the
    // first leg day takes +2.
    const d = weekShifts(week([300, 0, 0, 300, 0, 0, 0]));
    expect([...d.values()].reduce((a, x) => a + x, 0)).toBe(0);
    expect(d.get("2026-10-12")).toBe(216);
    expect(d.get("2026-10-15")).toBe(214);
    expect(d.get("2026-10-13")).toBe(-86);
  });

  it("the same shift every day, or none, is uniform", () => {
    expect(weekShifts(week([200, 200, 200, 200, 200, 200, 200])).size).toBe(0);
    expect(weekShifts(week([0, 0, 0, 0, 0, 0, 0])).size).toBe(0);
    expect(weekShifts([]).size).toBe(0);
  });
});

describe("shiftDay", () => {
  it("carbs take the delta; protein and fat stay", () => {
    const base = { kcal: 2300, protein: 150, fat: 64, carbs: 280, fiber: 32 };
    expect(shiftDay(base, 214)).toEqual({ ...base, kcal: 2514, carbs: 334 });
    expect(shiftDay(base, -86)).toEqual({ ...base, kcal: 2214, carbs: 259 }); // −21.5 → −21
    expect(shiftDay(base, 0)).toBe(base);
  });
});

describe("floorShifts", () => {
  it("no day goes under the floor", () => {
    const d = new Map([
      ["2026-10-12", 250],
      ["2026-10-13", -100],
    ]);
    // Base 1,850, floor 1,794: −100 would give 1,750, so −56.
    expect(floorShifts(d, 1850, 1794)).toEqual({ "2026-10-12": 250, "2026-10-13": -56 });
  });
});
