/** A day read in its week (ADR-0047). Numbers checked by hand in the comments. */
import { describe, expect, it } from "vitest";
import type { NutrientKey } from "./nutrients";
import { weekContext, type WeekDayInput } from "./week";

const zero: Record<NutrientKey, string> = {
  kcal: "0",
  protein: "0",
  carbs: "0",
  sugars: "0",
  fat: "0",
  saturatedFat: "0",
  fiber: "0",
  salt: "0",
};
const targets = {
  ...zero,
  kcal: "2500",
  protein: "167",
  fiber: "35",
  salt: "5",
  sugars: "110",
  saturatedFat: "27",
};
const d = (
  day: string,
  eaten: Partial<Record<NutrientKey, string>>,
  logged = true,
): WeekDayInput => ({
  day,
  logged,
  eaten: { ...zero, ...eaten },
  targets,
  proteinLow: 137,
});

// The week of 2026-10-05 (Monday) to 10-11; the day read is Thursday 10-08.
const week = [
  d("2026-10-05", { kcal: "2500", protein: "160", fiber: "40", salt: "6" }),
  d("2026-10-06", { kcal: "3400", protein: "120", fiber: "30", salt: "8" }), // a big day
  d("2026-10-07", {}, false), // not logged: unknown, not a fast
  d("2026-10-08", { kcal: "800", protein: "60" }),
  d("2026-10-09", {}, false),
  d("2026-10-10", {}, false),
  d("2026-10-11", {}, false),
];

describe("weekContext", () => {
  it("energy: the days before, and what this day could eat to bring the week back", () => {
    const w = weekContext(week, "2026-10-08");
    expect(w.pastDays).toBe(2);
    expect(w.pastBalance).toBe(900); // (2,500 − 2,500) + (3,400 − 2,500)
    expect(w.daysLeft).toBe(4); // Thursday to Sunday
    // 2,500 − 900 ÷ 4 = 2,275
    expect(w.today).toEqual({ target: 2500, adjusted: 2275, capped: false });
  });

  it("never moves a day by more than 30 % of its target", () => {
    const binge = [d("2026-10-05", { kcal: "6500" }), ...week.slice(3)];
    // 2,500 − 4,000 ÷ 4 = 1,500, held at 1,750 (−30 %).
    expect(weekContext(binge, "2026-10-08").today).toEqual({
      target: 2500,
      adjusted: 1750,
      capped: true,
    });
  });

  it("protein day by day; fibre and salt as the week's average", () => {
    const w = weekContext(week, "2026-10-08");
    expect(w.protein).toEqual({ inZone: 1, of: 3 }); // 160 yes; 120 and 60 no
    expect(w.averages.find((a) => a.key === "fiber")).toEqual({
      key: "fiber",
      average: 35, // (40 + 30) ÷ 2: the logged days before this one
      target: 35,
      kind: "min",
    });
    expect(w.averages.find((a) => a.key === "salt")?.average).toBe(7);
  });

  it("a note when the logged days swing, never on a steady week", () => {
    const swings = [
      d("2026-10-05", { kcal: "1500" }),
      d("2026-10-06", { kcal: "3500" }),
      d("2026-10-07", { kcal: "1600" }),
      d("2026-10-08", {}),
    ];
    expect(weekContext(swings, "2026-10-08").irregular).toBe(true);
    const steady = swings.map((x, i) =>
      i < 3 ? { ...x, eaten: { ...zero, kcal: "2500" } } : x,
    );
    expect(weekContext(steady, "2026-10-08").irregular).toBe(false);
  });

  it("the first day of the week has nothing before it", () => {
    const w = weekContext(week, "2026-10-05");
    expect(w.pastBalance).toBeNull();
    expect(w.today?.adjusted).toBe(2500);
  });

  it("never proposes less than the floor (the BMR)", () => {
    const binge = [d("2026-10-05", { kcal: "6500" }), ...week.slice(3)];
    // −30 % would be 1,750; the BMR of 1,795 holds.
    expect(weekContext(binge, "2026-10-08", 1795).today).toEqual({
      target: 2500,
      adjusted: 1795,
      capped: true,
    });
  });
});
