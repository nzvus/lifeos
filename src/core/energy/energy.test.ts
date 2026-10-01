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

  it("a quiet day: BMR × the sitting factor, + 10 % digestion", () => {
    const e = dayEnergy(body, quiet)!;
    expect(e.bmr).toBe(1730);
    expect(e.baseline).toEqual({ low: 1989, high: 2163 }); // ×1.15 / ×1.25 (1989.4999… in floats)
    expect(e.walking).toEqual({ low: 0, high: 0 });
    expect(e.total.done).toEqual({ low: 2210, high: 2403 }); // ÷ 0.9
    expect(e.total.withPlan).toEqual(e.total.done);
  });

  it("walking from minutes or steps, net of resting", () => {
    const e = dayEnergy(body, { ...quiet, walkingMin: 30, steps: 6000 })!; // 6000 steps ≈ 60 min wins
    // (3.0−1)×75×1 = 150, (3.8−1)×75×1 = 210
    expect(e.walking).toEqual({ low: 150, high: 210 });
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
    expect(e.total.withPlan.low - e.total.done.low).toBe(
      Math.round((2215 + 150) / 0.9) - Math.round(2215 / 0.9),
    );
    expect(e.total.withPlan.high).toBeGreaterThan(e.total.done.high);
  });
});

describe("dynamicTargets", () => {
  it("energy = midpoint with the plan − deficit; protein and fat per kg; carbs the rest", () => {
    const e = dayEnergy(body, quiet)!; // with plan 2210–2403 → midpoint 2306.5
    const t = dynamicTargets(e, "75", GOAL_PRESETS.cut); // −500, 2.2 g/kg, 0.8 g/kg
    // carbs = (1807 − 165×4 − 60×9) ÷ 4 = 151.75
    expect(t).toEqual({ kcal: 1807, protein: 165, fat: 60, carbs: 152, fiber: 25 });
    // A surplus for muscle gain.
    expect(dynamicTargets(e, "75", GOAL_PRESETS.gain).kcal).toBe(2557);
  });

  it("never below 1200 kcal", () => {
    const e = dayEnergy({ ...body, weightKg: "45", heightCm: 150 }, quiet)!;
    expect(
      dynamicTargets(e, "45", { deficitKcal: 1500, proteinGPerKg: "2", fatGPerKg: "0.8" })
        .kcal,
    ).toBe(1200);
  });
});
