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

  it("walking: a declared walk whole, steps only beyond the level's own, net of resting", () => {
    // 11 000 steps sitting: 6000 beyond its 5000 ≈ 60 min; (3.0−1)×75×1 = 150, (3.8−1)×75×1 = 210
    expect(dayEnergy(body, { ...quiet, steps: 11000 })!.walking).toEqual({
      low: 150,
      high: 210,
    });
    // The same steps on one's feet all day are already in the level (10 000): 10 min.
    expect(
      dayEnergy(body, { ...quiet, level: "on_feet", steps: 11000 })!.walking,
    ).toEqual({
      low: 25,
      high: 35,
    });
    // A 30-minute walk beats 6000 steps sitting (10 min beyond); under the level's steps, nothing.
    expect(dayEnergy(body, { ...quiet, walkingMin: 30, steps: 6000 })!.walking).toEqual({
      low: 75,
      high: 105,
    });
    expect(dayEnergy(body, { ...quiet, steps: 4000 })!.walking).toEqual({
      low: 0,
      high: 0,
    });
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
    expect(t).toEqual({ kcal: 1576, protein: 165, fat: 60, carbs: 94, fiber: 22 });
    // A surplus for muscle gain.
    expect(dynamicTargets(e, "75", GOAL_PRESETS.gain).kcal).toBe(2326);
  });

  it("never below 1200 kcal", () => {
    const e = dayEnergy({ ...body, weightKg: "45", heightCm: 150 }, quiet)!;
    expect(
      dynamicTargets(e, "45", { deficitKcal: 1500, proteinGPerKg: "2", fatGPerKg: "0.8" })
        .kcal,
    ).toBe(1200);
  });
});
