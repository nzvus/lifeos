import { describe, expect, it } from "vitest";
import { modelTargets, targetsOn, type DayModel, type TargetDecision } from "./targets";

// The developer's models (converted v1 day types) and the automatic week of 19 Oct.
const rec: DayModel = {
  name: "Rec",
  targets: { mode: "dynamic", deficitKcal: 200, proteinGPerKg: "2.2", fatGPerKg: "0.8" },
};
const rest: DayModel = {
  name: "Rest",
  targets: {
    mode: "fixed",
    kcal: "2000",
    protein: "150",
    carbs: "200",
    fat: "60",
    fibre: "40",
    salt: "4",
  },
};
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

describe("a day's targets from its model (dossiers/targets.md §5)", () => {
  it("a dynamic model on the automatic week: E − the goal's deficit, per kg, carbs the rest", () => {
    const t = modelTargets(rec, auto)!;
    expect([t.kcal, t.protein, t.fat, t.carbs, t.fibre]).toEqual([
      2211, 167, 61, 249, 31,
    ]);
    expect(t.basis).toMatchObject({ model: "Rec", deficitFrom: "goal", floored: false });
  });

  it("without a goal the model's own deficit; never under the BMR", () => {
    const noGoal = { ...auto, payload: { ...auto.payload, deficitKcal: null } };
    expect(modelTargets(rec, noGoal)!.kcal).toBe(2333);
    const low = { ...auto, payload: { ...auto.payload, expenditureKcal: 1900 } };
    expect(modelTargets(rec, low)).toMatchObject({
      kcal: 1792,
      basis: { floored: true },
    });
  });

  it("a fixed model keeps its numbers (§8, 4)", () => {
    expect(modelTargets(rest, auto)).toMatchObject({
      from: "model",
      kcal: 2000,
      protein: 150,
      salt: 4,
    });
  });

  it("precedence: the day's own, then a fixed model, then the week with the model", () => {
    const own: TargetDecision = {
      kind: "day_targets",
      day: "2026-10-24",
      payload: { kcal: "1800" },
    };
    expect(targetsOn([own, auto], "2026-10-24", rest)!.kcal).toBe(1800);
    expect(targetsOn([auto], "2026-10-24", rest)!.kcal).toBe(2000);
    expect(targetsOn([auto], "2026-10-24", rec)!.kcal).toBe(2211);
    // After its 7 days an automatic week is not in force.
    expect(targetsOn([auto], "2026-10-26", rec)).toBeNull();
  });
});
