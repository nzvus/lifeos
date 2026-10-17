import { describe, expect, it } from "vitest";
import { dayPrior, filterInputs } from "./day";
import {
  bmr,
  cadenceBands,
  everydayFactor,
  hoursOnFeet,
  mid,
  stepsKcal,
} from "./everyday";
import type { SetDone } from "./training";
import {
  activityCost,
  mechanicalFloor,
  relativeIntensity,
  sessionCost,
} from "./training";

describe("BMR", () => {
  it("Mifflin-St Jeor, or Katch-McArdle with a body fat %", () => {
    expect(bmr({ sex: "male", kg: 71, heightCm: 178, age: 30 })).toBe(1677.5);
    expect(bmr({ sex: "female", kg: 60, heightCm: 165, age: 30 })).toBe(1320.25);
    expect(
      bmr({ sex: "male", kg: 71, heightCm: 178, age: 30, bodyFatPct: 15 }),
    ).toBeCloseTo(1673.56, 2);
  });
});

describe("everyday factor by hours on one's feet", () => {
  it("keeps v1's three levels as points and interpolates between them", () => {
    expect(everydayFactor(2)).toEqual({ low: 1.15, high: 1.25 });
    expect(everydayFactor(5)).toEqual({ low: 1.2, high: 1.32 });
    expect(everydayFactor(8)).toEqual({ low: 1.27, high: 1.42 });
    const f = everydayFactor(6.5);
    expect(f.low).toBeCloseTo(1.235, 3);
    expect(f.high).toBeCloseTo(1.37, 3);
    expect(everydayFactor(0)).toEqual(everydayFactor(2));
    expect(everydayFactor(12)).toEqual(everydayFactor(8));
  });
  it("hours on one's feet come from the day's blocks", () => {
    const blocks = [
      { minutes: 480, onFeet: 0.25 }, // desk work
      { minutes: 60, onFeet: 1 }, // commute on foot and standing
    ];
    expect(hoursOnFeet(blocks)).toBe(3);
  });
});

describe("steps by cadence band", () => {
  it("from the phone's minutes: 100 steps/min or more is a walk", () => {
    const perMinute = [0, 40, 60, 105, 120, 0, 99];
    expect(cadenceBands({ type: "minutes", perMinute })).toEqual({
      walkMin: 2,
      incidentalMin: 3,
    });
  });
  it("from a day's count and its share in bouts of ten minutes or more", () => {
    const b = cadenceBands({ type: "total", steps: 8800, walkShare: 0.5 });
    expect(b.walkMin).toBe(40);
    expect(b.incidentalMin).toBeCloseTo(62.86, 2);
    // 40 min at 2.0–2.8 net MET and 62.9 at 1.0–1.5, for 71 kg.
    const k = stepsKcal({ type: "total", steps: 8800, walkShare: 0.5 }, 71);
    expect(k.low).toBeCloseTo(169.05, 1);
    expect(k.high).toBeCloseTo(244.1, 1);
  });
});

/** Sets of `work` seconds, each followed by `rest` seconds. */
function timed(
  n: number,
  work: number,
  rest: number,
  s: Omit<SetDone, "start" | "end">,
): SetDone[] {
  return Array.from({ length: n }, (_, i) => ({
    ...s,
    start: i * (work + rest) * 1000,
    end: (i * (work + rest) + work) * 1000,
  }));
}

describe("a session, set by set", () => {
  it("the spec's session: 55 min with 17 of sets is ≈ 110, not v1's 277", () => {
    // 17 sets of 60 s with ≈ 2 min 20 s between them: 17 min of work, ≈ 37 of rests.
    const sets = timed(17, 60, 140, {
      exercise: "x",
      cls: "upperCompound",
      reps: 10,
      kg: 60,
      rir: 2,
    });
    const c = sessionCost({ sets, bodyKg: 71, bmr: 1692.5, novelty: 0.5 });
    expect(c.workMin).toBe(17);
    expect(c.restMin).toBeCloseTo(37.33, 2);
    expect(mid(c.session)).toBeGreaterThan(95);
    expect(mid(c.session)).toBeLessThan(135);
    expect(mid(c.prior)).toBeCloseTo(mid(c.session) * 0.75, 6);
    // v1: one MET (3.5–5) for all 55 minutes, gross.
    expect(4.25 * 71 * (55 / 60)).toBeGreaterThan(2 * mid(c.session));
  });
  it("untimed sets take reps × tempo, rests as given", () => {
    const sets: SetDone[] = Array.from({ length: 4 }, () => ({
      exercise: "curl",
      cls: "isolation",
      reps: 12,
      kg: 12,
    }));
    const c = sessionCost({ sets, bodyKg: 71, bmr: 1692.5, restMin: 6, novelty: 1 });
    expect(c.workMin).toBeCloseTo(2.2, 6); // 48 reps × 2.75 s
    expect(c.restMin).toBe(6);
  });
  it("relative intensity scales the MET: heavier sets cost more per minute", () => {
    expect(relativeIntensity({ reps: 5, kg: 100, e1rm: 125 })).toBe(0.8);
    expect(relativeIntensity({ reps: 8, kg: 80, rir: 2 })).toBeCloseTo(0.75, 6);
    expect(relativeIntensity({ reps: 8, kg: 80 })).toBeNull();
    const at = (kg: number) =>
      sessionCost({
        sets: timed(1, 60, 0, {
          exercise: "squat",
          cls: "lowerCompound",
          reps: 5,
          kg,
          e1rm: 140,
        }),
        bodyKg: 71,
        bmr: 1692.5,
        novelty: 0,
      }).work;
    expect(mid(at(120))).toBeGreaterThan(mid(at(80)));
  });
  it("EPOC stays within 5–15 %, higher with short rests and hard sets", () => {
    const share = (rest: number, rir: number) => {
      const sets = timed(16, 45, rest, {
        exercise: "x",
        cls: "upperCompound",
        reps: 10,
        kg: 50,
        rir,
      });
      const c = sessionCost({ sets, bodyKg: 71, bmr: 1692.5, novelty: 0 });
      return mid(c.epoc) / (mid(c.work) + mid(c.rest));
    };
    expect(share(240, 4)).toBeCloseTo(0.05, 6);
    expect(share(45, 1)).toBeCloseTo(0.15, 6); // 16 hard sets (≥ 15) and rests of 0.75 min: both at most
    expect(share(45, 1)).toBeGreaterThan(share(150, 4));
  });
  it("the tail is 3–5 % of BMR the next day, smaller for repeated work", () => {
    const sets = timed(3, 60, 120, {
      exercise: "x",
      cls: "lowerCompound",
      reps: 8,
      kg: 100,
    });
    const fresh = sessionCost({ sets, bodyKg: 71, bmr: 1700, novelty: 1 }).tail;
    expect(fresh).toEqual({ low: 51, high: 85 });
    expect(mid(sessionCost({ sets, bodyKg: 71, bmr: 1700, novelty: 0.5 }).tail)).toBe(34);
  });
  it("tonnage is a floor, not the driver", () => {
    const sets: SetDone[] = [
      { exercise: "squat", cls: "lowerCompound", reps: 8, kg: 100, romM: 0.6 },
    ];
    const f = mechanicalFloor(sets);
    expect(f.low).toBeCloseTo(4.5, 1);
    expect(f.high).toBeCloseTo(5.63, 2);
  });
  it("cardio: a MET band over its minutes, net of resting", () => {
    expect(activityCost({ low: 7, high: 9 }, 70, 30).session).toEqual({
      low: 210,
      high: 280,
    });
  });
});

describe("the day's prior", () => {
  it("adds base, steps and training; food's thermic effect is a part, never added", () => {
    const d = dayPrior({
      body: { sex: "male", kg: 71, heightCm: 178, age: 30 },
      hoursOnFeet: 2,
      steps: { type: "total", steps: 8800, walkShare: 0.5 },
      sessions: [{ prior: { low: 80, high: 100 } }],
      yesterdayTails: [{ low: 20, high: 40 }],
      intakeKcal: 2500,
    });
    expect(d.baseline.low).toBeCloseTo(1677.5 * 1.15, 6);
    expect(d.training).toEqual({ low: 100, high: 140 });
    expect(d.tef).toEqual({ low: 200, high: 300 });
    expect(d.total.low).toBeCloseTo(d.baseline.low + d.steps!.low + 100, 6);
    const i = filterInputs(d);
    expect(i.training).toBe(120);
    expect(i.baseline).toBeCloseTo(1677.5 * 1.2, 6);
  });
  it("no steps known: none counted, and E4's S is 0", () => {
    const d = dayPrior({
      body: { sex: "female", kg: 60, heightCm: 165, age: 30 },
      hoursOnFeet: 5,
      steps: null,
      sessions: [],
      yesterdayTails: [],
    });
    expect(d.steps).toBeNull();
    expect(d.tef).toBeNull();
    expect(filterInputs(d).steps).toBe(0);
  });
});
