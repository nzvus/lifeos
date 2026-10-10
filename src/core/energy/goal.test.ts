/** Targets from a goal (ADR-0043). Numbers checked by hand in the comments. */
import { describe, expect, it } from "vitest";
import { goalDeficit, goalTargets, lastCheckinDay, type GoalParams } from "./goal";

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
