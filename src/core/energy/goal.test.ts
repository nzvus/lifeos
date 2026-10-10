/** Targets from a goal (ADR-0043). Numbers checked by hand in the comments. */
import { describe, expect, it } from "vitest";
import {
  goalDeficit,
  goalTargets,
  goalToStore,
  lastCheckinDay,
  planGoal,
  type GoalParams,
} from "./goal";

const goal: GoalParams = {
  ratePctWeek: "-0.50",
  targetKg: null,
  kcalFloor: "standard",
  protein: "moderate",
  split: "balanced",
};

describe("goalDeficit", () => {
  it("turns % of body weight a week into kcal a day", () => {
    expect(goalDeficit("-0.50", 76)).toBe(418); // 0.38 kg × 7,700 ÷ 7
    expect(goalDeficit("0.25", 76)).toBe(-209); // a surplus
    expect(goalDeficit("0.00", 76)).toBe(0);
  });
});

describe("goalTargets", () => {
  it("spends minus the deficit; protein by preference; fat by split; carbs the rest", () => {
    const t = goalTargets(2700, goal, 76, 1794);
    expect(t.kcal).toBe(2282); // 2,700 − 418
    expect(t.protein).toBe(137); // 1.8 × 76
    expect(t.fat).toBe(63); // 25 % of 2,282 ÷ 9
    expect(t.carbs).toBe(292); // (2,282 − 548 − 567) ÷ 4 = 291.75
    expect(t.fiber).toBe(32);
    expect(t.floored).toBe(false);
  });

  it("protein is per kg of the target weight when there is one", () => {
    expect(
      goalTargets(2700, { ...goal, targetKg: "70.00", protein: "extra" }, 76, 1794)
        .protein,
    ).toBe(
      154, // 2.2 × 70
    );
  });

  it("never goes under the floor: the BMR, or 1,200 when low", () => {
    const steep = { ...goal, ratePctWeek: "-1.50" }; // −1,254 kcal a day
    const std = goalTargets(2700, steep, 76, 1794);
    expect(std.kcal).toBe(1794);
    expect(std.floored).toBe(true);
    expect(goalTargets(2200, { ...steep, kcalFloor: "low" }, 76, 1794).kcal).toBe(1200);
  });

  it("fat never under 0.6 g/kg, and higher on a low-carb split", () => {
    expect(
      goalTargets(1500, { ...goal, ratePctWeek: "0.00", split: "low_fat" }, 100, 1000)
        .fat,
    ).toBe(60);
    expect(goalTargets(2700, { ...goal, split: "low_carb" }, 76, 1794).fat).toBe(89); // 35 % of 2,282
  });
});

describe("lastCheckinDay", () => {
  it("is the latest check-in weekday on or before today", () => {
    // 2026-10-10 is a Saturday; Monday = 1.
    expect(lastCheckinDay("2026-10-10", 1)).toBe("2026-10-05");
    expect(lastCheckinDay("2026-10-12", 1)).toBe("2026-10-12");
    expect(lastCheckinDay("2026-10-10", 6)).toBe("2026-10-10");
    expect(lastCheckinDay("2026-10-10", 0)).toBe("2026-10-04");
  });
});

describe("planGoal (ADR-0045)", () => {
  const lose = (targetDay: string | null, targetKg: string | null = "72") => ({
    kind: "lose" as const,
    targetKg,
    targetDay,
  });
  // Today 2026-10-10, 76 kg, 4 kg to lose.

  it("a date within the optimal range: the rate it needs", () => {
    // 8 weeks: 4 ÷ 76 ÷ 8 = 0.66 % a week.
    expect(planGoal(lose("2026-12-05"), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.66,
      status: "optimal",
      expectedDay: "2026-12-05",
      range: { low: -0.5, high: -1 },
    });
  });

  it("too soon: the maximum, and the day it really takes", () => {
    // 4 weeks would need 1.32 %; at 1 % (0.76 kg a week) it takes 37 days.
    expect(planGoal(lose("2026-11-07"), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -1,
      status: "fast",
      expectedDay: "2026-11-16",
    });
  });

  it("far away: slower than optimal, but no slower than the scale can show", () => {
    // 12 weeks: 0.44 % a week.
    expect(planGoal(lose("2027-01-02"), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.44,
      status: "slow",
    });
    // A year to gain 2 kg at 70 kg: 0.055 %, kept at the 0.05 minimum.
    expect(
      planGoal(
        { kind: "gain", targetKg: "72", targetDay: "2027-10-10" },
        70,
        "2026-10-10",
      ),
    ).toMatchObject({ ratePctWeek: 0.05, status: "slow" });
  });

  it("without a day: the usual rate, and when it gets there", () => {
    // 0.7 % of 76 = 0.53 kg a week: 4 kg in 53 days.
    expect(planGoal(lose(null), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.7,
      expectedDay: "2026-12-02",
    });
    expect(
      planGoal({ kind: "gain", targetKg: null, targetDay: null }, 76, "2026-10-10"),
    ).toMatchObject({ ratePctWeek: 0.15, expectedDay: null });
  });

  it("reached: maintenance; recomposition and maintenance: steady", () => {
    expect(planGoal(lose("2026-12-05"), 72.2, "2026-10-10")).toMatchObject({
      ratePctWeek: 0,
      status: "reached",
    });
    expect(
      planGoal({ kind: "recomp", targetKg: null, targetDay: null }, 76, "2026-10-10"),
    ).toMatchObject({ ratePctWeek: 0, status: "steady" });
  });
});

describe("goalToStore", () => {
  const g = { kind: "lose" as const, targetKg: "72", targetDay: "2026-12-05" };
  it("stores the rate planned today", () => {
    expect(goalToStore(g, 76, "2026-10-10")).toEqual({
      ok: true,
      value: { ...g, ratePctWeek: "-0.66" },
    });
    expect(goalToStore(g, null, "2026-10-10")).toMatchObject({
      value: { ratePctWeek: "-0.70" },
    });
  });
  it("refuses a target the wrong way and a day already past", () => {
    expect(goalToStore({ ...g, targetKg: "80" }, 76, "2026-10-10")).toEqual({
      ok: false,
      field: "targetKg",
      code: "target_direction",
    });
    expect(goalToStore({ ...g, kind: "gain" }, 76, "2026-10-10")).toMatchObject({
      ok: false,
    });
    expect(goalToStore({ ...g, targetDay: "2026-10-10" }, 76, "2026-10-10")).toEqual({
      ok: false,
      field: "targetDay",
      code: "past_day",
    });
  });
});

describe("planGoal: recomposition with a target (ADR-0046)", () => {
  const recomp = (targetKg: string | null, targetDay: string | null = null) => ({
    kind: "recomp" as const,
    targetKg,
    targetDay,
  });
  it("without a target: maintenance", () => {
    expect(planGoal(recomp(null), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: 0,
      status: "steady",
    });
  });
  it("a lower target: a slow loss, 0.35 % a week without a day", () => {
    // 3 kg at 0.35 % of 76 (0.266 kg a week): 79 days.
    expect(planGoal(recomp("73"), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.35,
      expectedDay: "2026-12-28",
      range: { low: -0.25, high: -0.5 },
    });
  });
  it("a day too close: at most 0.5 % a week, slower than a cut", () => {
    expect(planGoal(recomp("73", "2026-11-07"), 76, "2026-10-10")).toMatchObject({
      ratePctWeek: -0.5,
      status: "fast",
    });
  });
  it("a higher target: a slow gain; at the target: maintenance", () => {
    expect(planGoal(recomp("77"), 76, "2026-10-10").ratePctWeek).toBe(0.1);
    expect(planGoal(recomp("76.2"), 76, "2026-10-10").status).toBe("steady");
  });
  it("any direction is fine for recomposition", () => {
    expect(goalToStore(recomp("80"), 76, "2026-10-10").ok).toBe(true);
  });
});
