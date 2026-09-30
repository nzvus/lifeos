/** Tests for core/nutrition/analysis.ts — the Targets page's numbers. */
import { describe, expect, it } from "vitest";
import { adherence, byDayType, eatingTimes, plansLeft } from "./analysis";
import { NUTRIENT_KEYS } from "./nutrients";
import type { DaySummary } from "./repositories/history";
import type { Targets } from "./targets";

const zero = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, "0"])) as Record<
  (typeof NUTRIENT_KEYS)[number],
  string
>;
const noTargets = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, null])) as Targets;

function day(
  date: string,
  kcal: string | null,
  extra: Partial<DaySummary> = {},
  protein = "100",
): DaySummary {
  return {
    day: date,
    totals: {
      nutrients: { ...zero, kcal: kcal ?? "0", protein },
      costCents: 0,
      costComplete: true,
    },
    logged: kcal !== null,
    targets: { ...noTargets, kcal: "2000", protein: "120" },
    dayType: "Riposo",
    eaten: [],
    plannedLeft: 0,
    ...extra,
  };
}

describe("adherence", () => {
  it("counts days on target over days with a target, skipping empty days", () => {
    const h = [
      day("2026-09-28", "2000"),
      day("2026-09-29", "2300", {}, "130"),
      day("2026-09-30", null),
    ];
    const rows = adherence(
      h,
      h.map((d) => d.targets!),
    );
    expect(rows.find((r) => r.nutrient === "kcal")).toEqual({
      nutrient: "kcal",
      onTarget: 1,
      withTarget: 2,
    });
    // protein is a minimum: 130 ≥ 120 counts, 100 does not
    expect(rows.find((r) => r.nutrient === "protein")).toEqual({
      nutrient: "protein",
      onTarget: 1,
      withTarget: 2,
    });
    expect(rows.find((r) => r.nutrient === "fiber")?.withTarget).toBe(0);
  });
});

describe("byDayType", () => {
  it("averages logged days per day type, most frequent first", () => {
    const rows = byDayType([
      day("2026-09-27", "2600", { dayType: "Palestra" }),
      day("2026-09-28", "2000"),
      day("2026-09-29", "1800"),
      day("2026-09-30", null),
    ]);
    expect(rows.map((r) => [r.dayType, r.days, r.kcal, r.kcalOnTarget])).toEqual([
      ["Riposo", 2, "1900", 1],
      ["Palestra", 1, "2600", 0],
    ]);
  });
});

describe("eatingTimes", () => {
  it("averages first/last times and splits energy by part of the day, in the user's zone", () => {
    const h = [
      day("2026-09-28", "900", {
        eaten: [
          { at: "2026-09-28T06:00:00Z", kcal: "300" }, // 08:00 Rome (morning)
          { at: "2026-09-28T18:00:00Z", kcal: "600" }, // 20:00 Rome (evening)
          { at: null, kcal: "100" },
        ],
      }),
      day("2026-09-29", "400", { eaten: [{ at: "2026-09-29T08:00:00Z", kcal: "400" }] }), // 10:00
    ];
    const r = eatingTimes(h, "Europe/Rome");
    expect(r.days).toBe(2);
    expect(r.first).toBe(9 * 60); // (8:00 + 10:00) / 2
    expect(r.last).toBe(15 * 60); // (20:00 + 10:00) / 2
    expect(r.window).toBe(6 * 60); // (12 h + 0) / 2
    expect(r.parts.find((p) => p.part === "morning")).toEqual({
      part: "morning",
      kcal: "700",
      share: 54,
    });
    expect(r.parts.find((p) => p.part === "evening")?.share).toBe(46);
    expect(r.untimed).toBe(1);
  });

  it("puts late snacks in the night part", () => {
    const h = [
      day("2026-09-28", "200", { eaten: [{ at: "2026-09-28T21:30:00Z", kcal: "200" }] }),
    ]; // 23:30
    expect(
      eatingTimes(h, "Europe/Rome").parts.find((p) => p.part === "night")?.share,
    ).toBe(100);
  });
});

describe("plansLeft", () => {
  it("counts unconfirmed plans on past days only", () => {
    const h = [
      day("2026-09-28", "0", { plannedLeft: 2 }),
      day("2026-09-30", "0", { plannedLeft: 1 }),
    ];
    expect(plansLeft(h, "2026-09-30")).toBe(2);
  });
});
