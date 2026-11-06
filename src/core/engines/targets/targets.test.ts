/**
 * E5. The pace and the week are v1's (ADR-0045/0046/0047): their cases are ported
 * here unchanged, as parity. The day's targets and the slots are v2's.
 */
import { describe, expect, it } from "vitest";
import { dayTargets } from "./day";
import { deficitKcal, planPace } from "./pace";
import { sharesOff, slotHints, slotTargets } from "./slots";
import type { WeekContext, WeekDay } from "./week";
import { weekContext, weekWatch } from "./week";

const FLAT = { loss: 7700, gain: 7700 };

describe("deficit", () => {
  it("v1's numbers with a flat 7,700; E4's density changes them", () => {
    expect(deficitKcal(-0.5, 76, FLAT)).toBe(418); // 0.38 kg × 7,700 ÷ 7
    expect(deficitKcal(0.25, 76, FLAT)).toBe(-209);
    expect(deficitKcal(0, 76, FLAT)).toBe(0);
    // 76 kg at 18 % fat: a loss is ≈ 6,244 kcal/kg, so 0.38 kg a week is ≈ 339 a day.
    expect(deficitKcal(-0.5, 76, { loss: 6244, gain: 5000 })).toBe(339);
    expect(deficitKcal(0.25, 76, { loss: 6244, gain: 5000 })).toBe(-136);
  });
});

describe("planPace (v1 ADR-0045)", () => {
  const lose = (targetDay: string | null, targetKg: number | null = 72) => ({
    kind: "lose" as const,
    targetKg,
    targetDay,
  });
  // Today 2026-10-10, 76 kg, 4 kg to lose.
  it("a date within the optimal range: the rate it needs", () => {
    expect(planPace(lose("2026-12-05"), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.66,
      status: "optimal",
      expectedDay: "2026-12-05",
      range: { low: -0.5, high: -1 },
    });
  });
  it("too soon: the maximum, and the day it really takes", () => {
    expect(planPace(lose("2026-11-07"), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -1,
      status: "fast",
      expectedDay: "2026-11-16",
    });
  });
  it("far away: slower than optimal, but no slower than the scale can show", () => {
    expect(planPace(lose("2027-01-02"), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.44,
      status: "slow",
    });
    expect(
      planPace({ kind: "gain", targetKg: 72, targetDay: "2027-10-10" }, 70, "2026-10-10"),
    ).toMatchObject({ ratePctWeek: 0.05, status: "slow" });
  });
  it("without a day: the usual rate, and when it gets there", () => {
    expect(planPace(lose(null), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.7,
      expectedDay: "2026-12-02",
    });
    expect(
      planPace({ kind: "gain", targetKg: null, targetDay: null }, 76, "2026-10-10"),
    ).toMatchObject({ ratePctWeek: 0.15, expectedDay: null });
  });
  it("reached: maintenance; recomposition and maintenance: steady", () => {
    expect(planPace(lose("2026-12-05"), 72.2, "2026-10-10")).toMatchObject({
      ratePctWeek: 0,
      status: "reached",
    });
    expect(
      planPace({ kind: "recomp", targetKg: null, targetDay: null }, 76, "2026-10-10"),
    ).toMatchObject({ ratePctWeek: 0, status: "steady" });
  });
});

describe("planPace: recomposition with a target (v1 ADR-0046)", () => {
  const recomp = (targetKg: number | null, targetDay: string | null = null) => ({
    kind: "recomp" as const,
    targetKg,
    targetDay,
  });
  it("a lower target: a slow loss, 0.35 % a week without a day", () => {
    expect(planPace(recomp(73), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.35,
      expectedDay: "2026-12-28",
      range: { low: -0.25, high: -0.5 },
    });
  });
  it("a day too close: at most 0.5 % a week, slower than a cut", () => {
    expect(planPace(recomp(73, "2026-11-07"), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.5,
      status: "fast",
    });
  });
  it("a higher target: a slow gain; at the target: maintenance", () => {
    expect(planPace(recomp(77), 76, "2026-10-10").ratePctWeek).toBe(0.1);
    expect(planPace(recomp(76.2), 76, "2026-10-10").status).toBe("steady");
  });
});

describe("dayTargets", () => {
  const base = {
    expenditure: 2700,
    deficit: 400,
    bmr: 1700,
    floor: "bmr" as const,
    weightKg: 76,
    protein: "extra" as const,
    split: "balanced" as const,
  };
  it("kcal = expenditure − deficit ± shift; protein by preference; fat by split; carbs the rest", () => {
    const t = dayTargets({ ...base, targetKg: 72, shiftKcal: 150 });
    expect(t.kcal).toBe(2450);
    expect(t.protein).toBe(158); // 2.2 × 72, the target weight
    expect(t.fat).toBe(68); // 25 % of 2,450 ÷ 9
    expect(t.carbs).toBe(302); // (2,450 − 632 − 612) ÷ 4 = 301.5
    expect(t.fibre).toBe(34);
    expect(t.floored).toBe(false);
  });
  it("with a body fat %, protein is per kg of lean mass (Helms 2014)", () => {
    expect(dayTargets({ ...base, bodyFatPct: 15 }).protein).toBe(200); // 3.1 × 64.6
  });
  it("never under the floor; fat never under 20 % or 0.6 g/kg; fibre at least 25 g", () => {
    const low = dayTargets({ ...base, expenditure: 1500, deficit: 600 });
    expect(low.kcal).toBe(1700);
    expect(low.floored).toBe(true);
    expect(
      dayTargets({ ...base, expenditure: 1500, deficit: 600, floor: "low" }).kcal,
    ).toBe(1200);
    const lowFat = dayTargets({
      ...base,
      split: "low_fat",
      expenditure: 1600,
      deficit: 0,
      weightKg: 110,
    });
    expect(lowFat.fat).toBe(66); // 0.6 × 110 beats 20 % of 1,700 ÷ 9 = 38
    expect(lowFat.fibre).toBe(25);
  });
  it("maxima: sugars 90 g per 2,000 kcal, saturated under 10 %, salt 5 g", () => {
    const t = dayTargets({ ...base, deficit: 700 });
    expect([t.kcal, t.sugars, t.saturatedFat, t.salt]).toEqual([2000, 90, 22, 5]);
  });
});

describe("weekContext (v1 ADR-0047)", () => {
  const targets = {
    kcal: 2500,
    protein: 167,
    fibre: 35,
    salt: 5,
    sugars: 110,
    saturatedFat: 27,
  };
  const d = (day: string, eaten: Record<string, number>, logged = true): WeekDay => ({
    day,
    logged,
    eaten,
    targets,
    proteinLow: 137,
  });
  const week = [
    d("2026-10-05", { kcal: 2500, protein: 160, fibre: 40, salt: 6 }),
    d("2026-10-06", { kcal: 3400, protein: 120, fibre: 30, salt: 8 }),
    d("2026-10-07", {}, false),
    d("2026-10-08", { kcal: 800, protein: 60 }),
    d("2026-10-09", {}, false),
    d("2026-10-10", {}, false),
    d("2026-10-11", {}, false),
  ];
  it("energy: the days before, and what this day could eat to bring the week back", () => {
    const w = weekContext(week, "2026-10-08");
    expect(w.pastBalance).toBe(900);
    expect(w.daysLeft).toBe(4);
    expect(w.today).toEqual({ target: 2500, adjusted: 2275, capped: false });
  });
  it("never moves a day by more than 30 %, nor under the floor", () => {
    const binge = [d("2026-10-05", { kcal: 6500 }), ...week.slice(3)];
    expect(weekContext(binge, "2026-10-08").today).toEqual({
      target: 2500,
      adjusted: 1750,
      capped: true,
    });
    expect(weekContext(binge, "2026-10-08", 1795).today?.adjusted).toBe(1795);
  });
  it("protein day by day; fibre and salt as the week's average", () => {
    const w = weekContext(week, "2026-10-08");
    expect(w.protein).toEqual({ inZone: 1, of: 3 });
    expect(w.averages.find((a) => a.key === "fibre")).toEqual({
      key: "fibre",
      average: 35,
      target: 35,
      kind: "min",
    });
    expect(w.averages.find((a) => a.key === "salt")?.average).toBe(7);
  });
  it("a note when the logged days swing; the first day has nothing before it", () => {
    const swings = [
      d("2026-10-05", { kcal: 1500 }),
      d("2026-10-06", { kcal: 3500 }),
      d("2026-10-07", { kcal: 1600 }),
      d("2026-10-08", {}),
    ];
    expect(weekContext(swings, "2026-10-08").irregular).toBe(true);
    expect(weekContext(week, "2026-10-05").pastBalance).toBeNull();
  });
  it("weekWatch names the average furthest off its target", () => {
    const w: WeekContext = {
      ...weekContext(week, "2026-10-08"),
      averages: [
        { key: "salt", average: 7, target: 5, kind: "max" },
        { key: "fibre", average: 20, target: 35, kind: "min" },
      ],
    };
    expect(weekWatch(w)?.key).toBe("fibre"); // 43 % off beats 40 %
  });
});

describe("slots", () => {
  const day = dayTargets({
    expenditure: 2500,
    deficit: 0,
    bmr: 1700,
    floor: "bmr",
    weightKg: 75,
    protein: "moderate",
    split: "balanced",
  });
  it("a block's shares × the day's targets; protein follows kcal when not given", () => {
    expect(slotTargets(day, { kcal: 0.3, protein: 0.25 })).toEqual({
      kcal: 750,
      protein: 34,
      carbs: 101, // 0.3 × 335
      fat: 21,
    });
    expect(slotTargets(day, { kcal: 0.2 }).protein).toBe(27);
  });
  it("relation hints in grams for the weight", () => {
    expect(slotHints(["post-workout", "unknown"], 75)).toEqual([
      { tag: "post-workout", nutrient: "protein", low: 19, high: 30 },
    ]);
    expect(slotHints(["pre-workout"], 75)[0]).toMatchObject({
      nutrient: "carbs",
      low: 38,
      high: 75,
    });
  });
  it("says when a day's shares do not add up to 1", () => {
    expect(sharesOff([{ kcal: 0.3 }, { kcal: 0.4 }, { kcal: 0.3 }])).toBeNull();
    expect(sharesOff([{ kcal: 0.3 }, { kcal: 0.4 }])).toBe(0.7);
  });
});
