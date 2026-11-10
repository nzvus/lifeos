import { describe, expect, it } from "vitest";
import { foodParams, type Goal } from "../goals";
import { dynamicTargets, targetsOn, type TargetDecision } from "./targets";

// «Rec»'s numbers as goals (drizzle/0008 copies them unchanged) and the automatic week of 19 Oct.
const goal = (source: string, value: number): Goal => ({
  id: source,
  source,
  metric: { source },
  target: "at_least",
  value,
  low: null,
  high: null,
  by: null,
  since: "2026-10-01",
});
const rec = foodParams([
  goal("foodDeficit", 200),
  goal("proteinPerKg", 2.2),
  goal("fatPerKg", 0.8),
]);
const auto: TargetDecision = {
  kind: "week_targets",
  day: "2026-10-19",
  payload: {
    source: "auto",
    expenditureKcal: 2533,
    sigmaKcal: 224,
    trendKg: 75.83,
    bmr: 1792,
    deficitKcal: 322,
    ratePctWeek: -0.5,
  },
};

describe("a day's targets from the food goals (FD-20, FD-21, FD-22, PL-61)", () => {
  it("PL-61: with «Rec»'s goals the day's numbers are «Rec»'s (E − the pace's deficit, per kg, carbs the rest)", () => {
    const t = dynamicTargets(rec, auto)!;
    // The numbers the «Rec» model gave on the same week before phase 4.
    expect([t.kcal, t.protein, t.fat, t.carbs, t.fibre]).toEqual([
      2211, 167, 61, 249, 31,
    ]);
    expect(t.basis).toMatchObject({ deficitFrom: "pace", floored: false });
  });

  it("FD-21: without a weight goal the deficit goal; never under the BMR", () => {
    const noGoal = { ...auto, payload: { ...auto.payload, deficitKcal: null } };
    expect(dynamicTargets(rec, noGoal)).toMatchObject({
      kcal: 2333,
      basis: { deficitFrom: "goal" },
    });
    const low = { ...auto, payload: { ...auto.payload, expenditureKcal: 1900 } };
    expect(dynamicTargets(rec, low)).toMatchObject({
      kcal: 1792,
      basis: { floored: true },
    });
  });

  it("FD-22: no food goals → maintenance, 1.8 g/kg protein, 0.8 g/kg fat", () => {
    const noGoal = { ...auto, payload: { ...auto.payload, deficitKcal: null } };
    expect(dynamicTargets(foodParams([]), noGoal)).toMatchObject({
      kcal: 2533,
      protein: 136,
      basis: { deficitFrom: "none" },
    });
  });

  it("precedence: the day's own numbers, then the week with the goals", () => {
    const own: TargetDecision = {
      kind: "day_targets",
      day: "2026-10-24",
      payload: { kcal: "1800" },
    };
    expect(targetsOn([own, auto], "2026-10-24", rec)!.kcal).toBe(1800);
    // An old «Cambia la giornata» row names a model and holds no numbers: the week's.
    const changed: TargetDecision = {
      kind: "day_targets",
      day: "2026-10-24",
      payload: { profileId: "x" },
    };
    expect(targetsOn([changed, auto], "2026-10-24", rec)!.kcal).toBe(2211);
    // After its 7 days an automatic week is not in force.
    expect(targetsOn([auto], "2026-10-26", rec)).toBeNull();
  });
});
