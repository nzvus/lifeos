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

  it("a quiet day: BMR × the sitting factor, plus the level's usual steps (ADR-0051)", () => {
    const e = dayEnergy(body, quiet)!;
    expect(e.bmr).toBe(1730);
    expect(e.baseline).toEqual({ low: 1989, high: 2163 }); // ×1.15 / ×1.25 (1989.4999… in floats)
    // No steps logged: sitting's usual 5000 = 50 min: 2×75×50/60, 2.8×75×50/60.
    expect(e.walking).toEqual({ low: 125, high: 175 });
    expect(e.total.done).toEqual({ low: 1989 + 125, high: 2163 + 175 });
    expect(e.total.withPlan).toEqual(e.total.done);
  });

  it("ADR-0051: the day type keeps its factor; every step counts from zero, one cost per step", () => {
    // 11 000 steps = 110 min of walking: (3.0−1)×75×110/60 = 275, (3.8−1)×… = 385.
    const e = dayEnergy(body, { ...quiet, level: "sitting", steps: 11000 })!;
    expect(e.inputs.factor).toEqual([1.15, 1.25]);
    expect(e.inputs.level).toBe("sitting");
    expect(e.inputs.walk.source).toBe("steps");
    expect(e.walking).toEqual({ low: 275, high: 385 });
    const quietFeet = dayEnergy(body, { ...quiet, level: "on_feet", steps: 6000 })!;
    expect(quietFeet.inputs.factor).toEqual([1.27, 1.42]);
    expect(quietFeet.walking).toEqual({ low: 150, high: 210 });
    // The 2026-10-11 report: sitting with 7500 steps is no longer below mixed with 3000.
    const total = (level: "sitting" | "mixed", steps: number) => {
      const t = dayEnergy(body, { ...quiet, level, steps })!.total.done;
      return t.low + t.high;
    };
    expect(total("sitting", 7500)).toBeGreaterThan(total("mixed", 3000));
    // Every step costs the same: 2500 more is the same wherever it falls.
    const at = (level: "sitting" | "mixed", steps: number) =>
      dayEnergy(body, { ...quiet, level, steps })!.walking.high;
    expect(
      Math.abs(
        at("sitting", 7500) -
          at("sitting", 5000) -
          (at("mixed", 15000) - at("mixed", 12500)),
      ),
    ).toBeLessThanOrEqual(1); // rounding
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
    // 10 000 left = 100 min (the 90 declared minutes don't add).
    expect(e.walking).toEqual({ low: 250, high: 350 });
  });

  it("without steps, the walk's minutes add on the level's usual steps", () => {
    const e = dayEnergy(body, { ...quiet, walkingMin: 30 })!;
    // 50 usual + 30 = 80 min: (3.0−1)×75×80/60 = 200, (3.8−1)×… = 280
    expect(e.walking).toEqual({ low: 200, high: 280 });
    expect(e.inputs.walk.source).toBe("walk");
    // What the day type and the walk imply: sitting's 5000 + 30 × 100.
    expect(e.inputs.walk.estimatedSteps).toBe(8000);
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
    expect(e.total.done).toEqual({ low: 1989 + 125 + 225, high: 2163 + 175 + 375 });
    expect(e.total.withPlan.low - e.total.done.low).toBe(150);
    expect(e.total.withPlan.high).toBeGreaterThan(e.total.done.high);
  });
});

describe("dynamicTargets", () => {
  // One step logged: walking rounds to 0, so the numbers are the sitting factor's alone.
  const still = { ...quiet, steps: 1 };
  it("energy = midpoint with the plan − deficit; protein and fat per kg; carbs the rest", () => {
    const e = dayEnergy(body, still)!; // with plan 1989–2163 → midpoint 2076
    const t = dynamicTargets(e, "75", GOAL_PRESETS.cut); // −500, 2.2 g/kg, 0.8 g/kg
    // carbs = (1576 − 165×4 − 60×9) ÷ 4 = 94; fiber 14 per 1000 kcal = 22.1
    expect(t).toEqual({
      kcal: 1576,
      protein: 165,
      fat: 60,
      carbs: 94,
      fiber: 22,
    });
    // A surplus for muscle gain.
    expect(dynamicTargets(e, "75", GOAL_PRESETS.gain).kcal).toBe(2326);
  });

  it("carbs take the rest, however much: fat is not raised to absorb it (ADR-0040)", () => {
    const e = dayEnergy(body, still)!; // midpoint 2076
    const t = dynamicTargets(e, "75", {
      deficitKcal: 0,
      proteinGPerKg: "1.8",
      fatGPerKg: "0.8",
    });
    // fat = max(0.8 × 75 = 60, 25 % of 2076 ÷ 9 = 58) = 60; carbs = (2076 − 540 − 540) ÷ 4 = 249,
    // above a rest day's 3 g/kg (225): before ADR-0040 fat rose to 71 g instead.
    expect(t).toMatchObject({ kcal: 2076, protein: 135, fat: 60, carbs: 249 });
    expect(t.protein * 4 + t.fat * 9 + t.carbs * 4).toBeCloseTo(t.kcal, -1);
  });

  it("fat never under 25 % of the energy (the health minimum is 20 %)", () => {
    const e = dayEnergy(body, still)!; // midpoint 2076
    const t = dynamicTargets(e, "75", {
      deficitKcal: -1000,
      proteinGPerKg: "1.8",
      fatGPerKg: "0.6",
    });
    // 0.6 × 75 = 45 g, but 25 % of 3076 kcal ÷ 9 = 85 g.
    expect(t).toMatchObject({ kcal: 3076, fat: 85 });
  });

  it("never below 1200 kcal", () => {
    const e = dayEnergy({ ...body, weightKg: "45", heightCm: 150 }, still)!;
    expect(
      dynamicTargets(e, "45", { deficitKcal: 1500, proteinGPerKg: "2", fatGPerKg: "0.8" })
        .kcal,
    ).toBe(1200);
  });
});
