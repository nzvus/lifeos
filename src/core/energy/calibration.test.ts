/**
 * Tests for core/energy/calibration.ts (ADR-0041): the slope, and the
 * adaptive factor checked on simulated people whose real expenditure is
 * known — noisy scale, days not logged, days half-logged.
 */
import { describe, expect, it } from "vitest";
import { addDays } from "../shared/dates";
import {
  calibrate,
  weightSlope,
  type CalibrationDay,
  type WeighInPoint,
} from "./calibration";
import { dayEnergy } from "./energy";

const FROM = "2026-07-01";
/** Weigh-ins every `every` days on a straight line of `perWeek` kg. */
const weighIns = (perWeek: number, every = 3) =>
  Array.from({ length: Math.floor(27 / every) + 1 }, (_, i) => ({
    day: addDays(FROM, i * every),
    kg: 80 + (perWeek / 7) * i * every,
  }));

/** A small deterministic random generator (tests must not flake). */
function rng(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2 ** 31;
    return x / 2 ** 31;
  };
}
/** Normal noise from two uniforms (Box–Muller). */
const gauss = (r: () => number) =>
  Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());

/**
 * A person over `n` days: the model says baseline B and other O; really
 * they spend c × B + O. They eat around `eat`; the body changes by the
 * balance ÷ 7,700; the scale adds ±`noise` kg of water. Some days are not
 * logged, some only half.
 */
function simulate(o: {
  n: number;
  c: number;
  eat: number;
  B?: number;
  O?: number;
  noise?: number;
  unlogged?: number;
  halfLogged?: number;
  weighEvery?: number;
  seed?: number;
}): { days: CalibrationDay[]; weighIns: WeighInPoint[] } {
  const r = rng(o.seed ?? 7);
  const B = o.B ?? 2000;
  const O = o.O ?? 300;
  let kg = 80;
  const days: CalibrationDay[] = [];
  const weighIns: WeighInPoint[] = [];
  for (let i = 0; i < o.n; i++) {
    const day = addDays(FROM, i);
    const eaten = o.eat + 250 * gauss(r);
    kg += (eaten - (o.c * B + O)) / 7700;
    const u = r();
    const logged =
      u < (o.unlogged ?? 0.1)
        ? null
        : u < (o.unlogged ?? 0.1) + (o.halfLogged ?? 0.05)
          ? eaten * 0.4
          : eaten;
    days.push({ day, eatenKcal: logged, baseline: B, other: O });
    if (i % (o.weighEvery ?? 1) === 0)
      weighIns.push({
        day,
        kg: Math.round((kg + (o.noise ?? 0.6) * gauss(r)) * 10) / 10,
      });
  }
  return { days, weighIns };
}

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

describe("calibrate (adaptive, ADR-0041)", () => {
  it("learns a body that spends 10 % more than the model, within ± 0.05, in 8 weeks", () => {
    const { days, weighIns } = simulate({ n: 56, c: 1.1, eat: 2100 });
    const r = calibrate(days, weighIns, 1);
    expect(r.verdict).toBe("ok");
    expect(r.factor).toBeGreaterThan(1.05);
    expect(r.factor).toBeLessThan(1.15);
    expect(r.sigma).toBeLessThan(0.04);
    expect(r.proposed).toBe(r.factor);
    expect(r.weeks).toBe(7);
    // 1.1 × 2000 + 300 = 2500 a day, roughly.
    expect(r.expenditure!.mid).toBeGreaterThan(2400);
    expect(r.expenditure!.mid).toBeLessThan(2600);
  });

  it("learns one that spends less, whatever it eats", () => {
    for (const eat of [1700, 2300]) {
      const { days, weighIns } = simulate({ n: 70, c: 0.9, eat, seed: 3 });
      const r = calibrate(days, weighIns, 1);
      expect(Math.abs(r.factor - 0.9)).toBeLessThan(0.05);
    }
  });

  it("leaves half-logged days out instead of reading them as a big deficit", () => {
    const sim = simulate({ n: 56, c: 1.0, eat: 2300, halfLogged: 0.25, seed: 11 });
    const r = calibrate(sim.days, sim.weighIns, 1);
    expect(r.incompleteDays).toBeGreaterThan(5);
    expect(Math.abs(r.factor - 1)).toBeLessThan(0.05);
  });

  it("after three weeks it moves, but is not sure enough to propose", () => {
    const { days, weighIns } = simulate({ n: 21, c: 1.2, eat: 2200 });
    const r = calibrate(days, weighIns, 1);
    expect(r.verdict).toBe("ok");
    expect(r.factor).toBeGreaterThan(1.02); // pulled toward 1.2, held by the prior
    expect(r.sigma).toBeGreaterThan(0.04);
    expect(r.proposed).toBeNull();
  });

  it("a fitting accepted factor proposes nothing", () => {
    const { days, weighIns } = simulate({ n: 56, c: 1.1, eat: 2100 });
    const first = calibrate(days, weighIns, 1);
    expect(calibrate(days, weighIns, first.factor).proposed).toBeNull();
  });

  it("an implausible weigh-in (reliability 0.02) does not move it", () => {
    const sim = simulate({ n: 56, c: 1.0, eat: 2300, seed: 5 });
    const clean = calibrate(sim.days, sim.weighIns, 1);
    const typo = sim.weighIns.map((w, i) =>
      i === 40 ? { ...w, kg: w.kg + 10, weight: 0.02 } : w,
    );
    expect(Math.abs(calibrate(sim.days, typo, 1).factor - clean.factor)).toBeLessThan(
      0.01,
    );
  });

  it("not enough data → a verdict and no proposal", () => {
    const few = simulate({ n: 56, c: 1.1, eat: 2100, weighEvery: 20 });
    expect(calibrate(few.days, few.weighIns, 1)).toMatchObject({
      verdict: "few_weigh_ins",
      proposed: null,
      expenditure: null,
    });
    const unlogged = simulate({ n: 56, c: 1.1, eat: 2100, unlogged: 0.8 });
    expect(calibrate(unlogged.days, unlogged.weighIns, 1).verdict).toBe("few_logged");
    const noBody = few.days.map((d) => ({ ...d, baseline: null, other: null }));
    expect(calibrate(noBody, few.weighIns, 1).verdict).toBe("no_body");
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
