/** Tests for core/energy/calibration.ts (ADR-0020): trend, observed vs estimated, verdicts. */
import { describe, expect, it } from "vitest";
import { addDays } from "../shared/dates";
import { calibrate, weightSlope, type CalibrationDay } from "./calibration";
import { dayEnergy, type Energy } from "./energy";

/** A model estimate of 2500 kcal (midpoint), baseline 2000. */
const energy = {
  bmr: 1700,
  baseline: { low: 1900, high: 2100 },
  walking: { low: 0, high: 0 },
  training: { done: { low: 0, high: 0 }, planned: { low: 0, high: 0 } },
  total: { done: { low: 2400, high: 2600 }, withPlan: { low: 2400, high: 2600 } },
} satisfies Energy;

const FROM = "2026-09-03";
const days = (n: number, eaten: (i: number) => number | null): CalibrationDay[] =>
  Array.from({ length: 28 }, (_, i) => ({
    day: addDays(FROM, i),
    eatenKcal: i < n ? eaten(i) : null,
    energy,
  }));
/** Weigh-ins every `every` days on a straight line of `perWeek` kg. */
const weighIns = (perWeek: number, every = 3) =>
  Array.from({ length: Math.floor(27 / every) + 1 }, (_, i) => ({
    day: addDays(FROM, i * every),
    kg: 80 + (perWeek / 7) * i * every,
  }));

describe("weightSlope", () => {
  it("is the least-squares slope in kg/day; null without two days", () => {
    expect(weightSlope(weighIns(-0.7, 7))).toBeCloseTo(-0.1, 10);
    // Noise around the line does not move it much; two single weigh-ins would.
    const noisy = weighIns(-0.7, 1).map((w, i) => ({
      ...w,
      kg: w.kg + (i % 2 ? 0.6 : -0.6),
    }));
    expect(weightSlope(noisy)!).toBeCloseTo(-0.1, 1);
    expect(weightSlope([{ day: FROM, kg: 80 }])).toBeNull();
    expect(
      weightSlope([
        { day: FROM, kg: 80 },
        { day: FROM, kg: 81 },
      ]),
    ).toBeNull();
  });
});

describe("calibrate", () => {
  it("losing on more than the model says → spends more: the baseline goes up", () => {
    // 2500 eaten, −0.2 kg/week → observed 2500 + 0.2/7 × 7700 = 2720; estimated 2500.
    // The baseline takes the whole gap: 2000 + 220 → ×1.11.
    const c = calibrate(
      days(28, () => 2500),
      weighIns(-0.2),
      1,
    );
    expect(c).toMatchObject({
      verdict: "ok",
      loggedDays: 28,
      trendKgPerWeek: -0.2,
      intake: 2500,
      observed: 2720,
      estimated: 2500,
      proposed: 1.11,
    });
  });

  it("starts from the current factor; a fitting model proposes nothing", () => {
    // Stable weight on 2500 = the estimate: nothing to change.
    expect(
      calibrate(
        days(28, () => 2500),
        weighIns(0),
        1.1,
      ).proposed,
    ).toBeNull();
    // Gaining on 2500: spends less. From 1.10: 1.10 × (2000 − 220) ÷ 2000 = 0.979 → 0.98.
    expect(
      calibrate(
        days(28, () => 2500),
        weighIns(0.2),
        1.1,
      ).proposed,
    ).toBe(0.98);
  });

  it("never beyond 0.80–1.20", () => {
    expect(
      calibrate(
        days(28, () => 2500),
        weighIns(-1),
        1,
      ).proposed,
    ).toBe(1.2);
    expect(
      calibrate(
        days(28, () => 1500),
        weighIns(1),
        1,
      ).proposed,
    ).toBe(0.8);
  });

  it("not enough data → a verdict and no proposal", () => {
    const few = weighIns(-0.2, 7).slice(0, 3);
    expect(
      calibrate(
        days(28, () => 2500),
        few,
        1,
      ),
    ).toMatchObject({
      verdict: "few_weigh_ins",
      proposed: null,
    });
    // 22 of 28 days logged is under 80 %.
    expect(
      calibrate(
        days(22, () => 2500),
        weighIns(-0.2),
        1,
      ),
    ).toMatchObject({
      verdict: "few_logged",
      loggedDays: 22,
      proposed: null,
    });
    const noBody = days(28, () => 2500).map((d) => ({ ...d, energy: null }));
    expect(calibrate(noBody, weighIns(-0.2), 1).verdict).toBe("no_body");
  });
});

describe("dayEnergy with a correction", () => {
  it("scales the baseline only (walking and training stay measured)", () => {
    const body = { sex: "male" as const, birthYear: 1996, heightCm: 180, weightKg: "75" };
    const facts = {
      day: "2026-10-01",
      level: "sitting" as const,
      walkingMin: 60,
      steps: null,
      sessions: [],
    };
    const plain = dayEnergy(body, facts)!;
    const fixed = dayEnergy({ ...body, correction: 1.1 }, facts)!;
    expect(fixed.baseline.low).toBe(Math.round(1730 * 1.15 * 1.1));
    expect(fixed.walking).toEqual(plain.walking);
  });
});
