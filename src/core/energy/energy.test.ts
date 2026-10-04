/** Tests for core/energy/energy.ts: BMR, the parts as ranges, plan vs done, targets. */
import { describe, expect, it } from "vitest";
import {
  bmrOf,
  dayEnergy,
  dynamicTargets,
  GOAL_PRESETS,
  missingBody,
  type Body,
} from "./energy";

const body: Body = { sex: "male", birthYear: 1996, heightCm: 180, weightKg: "75" };
const quiet = {
  day: "2026-10-01",
  level: "sitting" as const,
  walkingMin: null,
  steps: null,
  sessions: [],
};

describe("bmrOf (Mifflin-St Jeor)", () => {
  it("matches the textbook values", () => {
    // 10×75 + 6.25×180 − 5×30 + 5 = 1730
    expect(bmrOf("male", 75, 180, 30)).toBe(1730);
    // 10×60 + 6.25×165 − 5×30 − 161 = 1320.25
    expect(bmrOf("female", 60, 165, 30)).toBe(1320);
  });
});

describe("dayEnergy", () => {
  it("needs the body data, and says what is missing", () => {
    expect(dayEnergy({ ...body, heightCm: null }, quiet)).toBeNull();
    expect(
      missingBody({ sex: null, birthYear: null, heightCm: 180, weightKg: null }),
    ).toEqual(["sex", "birthYear", "weight"]);
  });

  it("a quiet day: BMR × the sitting factor, nothing on top (the factor has digestion in it)", () => {
    const e = dayEnergy(body, quiet)!;
    expect(e.bmr).toBe(1730);
    expect(e.baseline).toEqual({ low: 1989, high: 2163 }); // ×1.15 / ×1.25 (1989.4999… in floats)
    expect(e.walking).toEqual({ low: 0, high: 0 });
    expect(e.total.done).toEqual(e.baseline);
    expect(e.total.withPlan).toEqual(e.total.done);
  });

  it("ADR-0032: the day type keeps its factor; steps correct it at one cost per step", () => {
    // Sitting includes ~5000 steps; 11 000 is 6000 more = 60 min of walking:
    // (3.0−1)×75×1 = 150, (3.8−1)×75×1 = 210.
    const e = dayEnergy(body, { ...quiet, level: "sitting", steps: 11000 })!;
    expect(e.inputs.factor).toEqual([1.15, 1.25]);
    expect(e.inputs.level).toBe("sitting");
    expect(e.inputs.walk.source).toBe("steps");
    expect(e.walking).toEqual({ low: 150, high: 210 });
    // On my feet includes ~10 000: 6000 steps is 4000 fewer, the day goes down.
    const quietFeet = dayEnergy(body, { ...quiet, level: "on_feet", steps: 6000 })!;
    expect(quietFeet.inputs.factor).toEqual([1.5, 1.65]);
    expect(quietFeet.walking).toEqual({ low: -140, high: -100 });
    // Every step costs the same: 2500 more is the same wherever it falls.
    const at = (level: "sitting" | "mixed", steps: number) =>
      dayEnergy(body, { ...quiet, level, steps })!.walking.high;
    expect(at("sitting", 7500) - at("sitting", 5000)).toBe(
      at("mixed", 15000) - at("mixed", 12500),
    );
  });

  it("ADR-0032: a run's steps are taken out; a declared walk is inside the steps", () => {
    const e = dayEnergy(body, {
      ...quiet,
      level: "mixed",
      steps: 14000,
      sessionSteps: 4000,
      walkingMin: 90,
    })!;
    expect(e.inputs.walk.sessionSteps).toBe(4000);
    // 10 000 left − 7500 usual = 2500 = 25 min (the 90 declared minutes don't add).
    expect(e.walking).toEqual({ low: 63, high: 88 });
  });

  it("ADR-0032: without steps, the walk's minutes add on the day type", () => {
    const e = dayEnergy(body, { ...quiet, walkingMin: 30 })!;
    // (3.0−1)×75×0.5 = 75, (3.8−1)×75×0.5 = 105
    expect(e.walking).toEqual({ low: 75, high: 105 });
    expect(e.inputs.walk.source).toBe("walk");
    // What the day type and the walk imply: sitting's 5000 + 30 × 100.
    expect(e.inputs.walk.estimatedSteps).toBe(8000);
    expect(dayEnergy(body, quiet)!.walking).toEqual({ low: 0, high: 0 });
  });

  it("training done vs planned: the plan only moves the 'with the plan' total", () => {
    const e = dayEnergy(body, {
      ...quiet,
      sessions: [
        { status: "done", burn: { low: 300, high: 450 }, durationMin: 60 }, // net of 75 kcal resting
        { status: "planned", burn: { low: 200, high: 300 }, durationMin: 40 }, // net of 50
      ],
    })!;
    expect(e.training).toEqual({
      done: { low: 225, high: 375 },
      planned: { low: 150, high: 250 },
    });
    expect(e.total.done).toEqual({ low: 1989 + 225, high: 2163 + 375 });
    expect(e.total.withPlan.low - e.total.done.low).toBe(150);
    expect(e.total.withPlan.high).toBeGreaterThan(e.total.done.high);
  });
});

describe("dynamicTargets", () => {
  it("energy = midpoint with the plan − deficit; protein and fat per kg; carbs the rest", () => {
    const e = dayEnergy(body, quiet)!; // with plan 1989–2163 → midpoint 2076
    const t = dynamicTargets(e, "75", GOAL_PRESETS.cut); // −500, 2.2 g/kg, 0.8 g/kg
    // carbs = (1576 − 165×4 − 60×9) ÷ 4 = 94; fiber 14 per 1000 kcal = 22.1
    expect(t).toEqual({
      kcal: 1576,
      protein: 165,
      fat: 60,
      carbs: 94,
      fiber: 22,
      uncapped: null,
    });
    // A surplus for muscle gain.
    expect(dynamicTargets(e, "75", GOAL_PRESETS.gain).kcal).toBe(2326);
  });

  it("carbs stop at the top of their good zone; fat takes the rest, so the deficit holds", () => {
    const e = dayEnergy(body, quiet)!; // midpoint 2076
    // Maintenance: carbs (2076 − 135×4 − 60×9) ÷ 4 = 249 > a 225 g cap.
    const t = dynamicTargets(
      e,
      "75",
      { deficitKcal: 0, proteinGPerKg: "1.8", fatGPerKg: "0.8" },
      225,
    );
    // (2076 − 540 − 900) ÷ 9 = 71 g of fat (31 % of the energy): no energy lost.
    expect(t).toMatchObject({ carbs: 225, fat: 71, kcal: 2076, uncapped: null });
  });

  it("lowers the energy only when fat would pass 35 % of it", () => {
    const e = dayEnergy(body, quiet)!; // midpoint 2076
    const t = dynamicTargets(
      e,
      "75",
      { deficitKcal: 0, proteinGPerKg: "1.8", fatGPerKg: "0.8" },
      100,
    );
    // Fat stops at 35 % of 2076 = 80 g; 540 + 720 + 400 = 1660.
    expect(t).toMatchObject({ carbs: 100, fat: 80, kcal: 1660, uncapped: 2076 });
  });

  it("fat never under 25 % of the energy (the health minimum is 20 %)", () => {
    const e = dayEnergy(body, quiet)!; // midpoint 2076
    const t = dynamicTargets(e, "75", {
      deficitKcal: -1000,
      proteinGPerKg: "1.8",
      fatGPerKg: "0.6",
    });
    // 0.6 × 75 = 45 g, but 25 % of 3076 kcal ÷ 9 = 85 g.
    expect(t).toMatchObject({ kcal: 3076, fat: 85 });
  });

  it("never below 1200 kcal", () => {
    const e = dayEnergy({ ...body, weightKg: "45", heightCm: 150 }, quiet)!;
    expect(
      dynamicTargets(e, "45", { deficitKcal: 1500, proteinGPerKg: "2", fatGPerKg: "0.8" })
        .kcal,
    ).toBe(1200);
  });
});
