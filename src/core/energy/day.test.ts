import { describe, expect, it } from "vitest";
import { activitySteps, plannedSessionCost, priceSession } from "./day";

const run = (cardioM: number | null) => ({
  id: "r",
  day: "2026-10-28",
  minutes: 28,
  exercises: [{ pattern: "run", cardio: true, cardioMin: 28, cardioM, sets: [] }],
});

describe("priceSession (energy-day.md §5, activity.md §5)", () => {
  it("a run with its distance goes by ACSM: 5 km in 28 min at 77 kg ≈ 10,2 net MET × 28 min", () => {
    const s = priceSession(run(5000), { kg: 77, bmr: 1800 });
    // (11.2 ± 10 % − 1) × 77 kg × 28/60 h
    expect(s.burn.low).toBeCloseTo((11.2 * 0.9 - 1) * 77 * (28 / 60), -1);
    expect(s.burn.high).toBeCloseTo((11.2 * 1.1 - 1) * 77 * (28 / 60), -1);
    expect(s.prior.low).toBeCloseTo(s.burn.low * 0.75, 6);
  });
  it("without a distance, the mode's MET band (run 8–11)", () => {
    const s = priceSession(run(null), { kg: 77, bmr: 1800 });
    expect(s.burn.low).toBeCloseTo(7 * 77 * (28 / 60), 6);
    expect(s.burn.high).toBeCloseTo(10 * 77 * (28 / 60), 6);
  });
});

describe("activitySteps (activity.md §8)", () => {
  it("a 5 km run in 28 min: 165 steps a minute; a 2 km walk by the stride of 183 cm", () => {
    expect(activitySteps([run(5000)], 183)).toBe(4620);
    const walk = {
      ...run(2000),
      exercises: [
        { pattern: "walk", cardio: true, cardioMin: 25, cardioM: 2000, sets: [] },
      ],
    };
    expect(activitySteps([walk], 183)).toBe(Math.round(2000 / (0.415 * 1.83)));
  });
  it("a bike or a run with no distance takes nothing out", () => {
    const bike = {
      ...run(10000),
      exercises: [
        { pattern: "bike", cardio: true, cardioMin: 30, cardioM: 10000, sets: [] },
      ],
    };
    expect(activitySteps([bike, run(null)], 183)).toBe(0);
  });
});

describe("plannedSessionCost", () => {
  it("the median length of the sessions read, 3,5–5 MET net of rest, × 0,75 for the day", () => {
    const done = [53, 63, 40].map((minutes, i) => ({
      ...run(null),
      id: "s" + i,
      minutes,
    }));
    const c = plannedSessionCost(done, 77);
    expect(c.minutes).toBe(53);
    expect(c.burn.low).toBeCloseTo(2.5 * 77 * (53 / 60), 6);
    expect(c.prior.high).toBeCloseTo(4 * 77 * (53 / 60) * 0.75, 6);
  });
  it("no session read: 60 min", () => {
    expect(plannedSessionCost([], 77).minutes).toBe(60);
  });
});
