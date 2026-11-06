/**
 * E4 on simulated people whose truth is known (as v1 ADR-0041 did): a noisy
 * scale, days not logged, meals out logged short, training on some days.
 * The filter must find the baseline factor, the expenditure and a trend
 * closer to the truth than the scale, and say by its σ what it cannot tell.
 */
import { describe, expect, it } from "vitest";
import { addDays } from "../time/date";
import { bodyDensity, densityOf, estimatedBodyFatPct, forbesFatShare } from "./density";
import type { BodyDay, WeighIn } from "./filter";
import { bodyState, intakeOf, trendWeight } from "./filter";
import { implausibleWeighIns, plausibleGap, readWeighIn } from "./weigh-in";

function rng(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) % 2 ** 31;
    return x / 2 ** 31;
  };
}
const gauss = (r: () => number) =>
  Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());

const FROM = "2026-06-01";
const prior = { bodyFatPct: 18 };

/**
 * A person over `n` days: the priors say B = 2000, training T on three days a week,
 * steps S = 250; really they spend c·B + cT·T + S. The body changes by the balance
 * over the density of a loss or a gain; the scale adds water noise.
 */
function simulate(o: {
  n: number;
  c: number;
  cT: number;
  eat: number;
  training?: number;
  unlogged?: number;
  eatOut?: number;
  /** Estimates of meals out × this (0.75: logged 25 % short). */
  estimates?: number;
  noise?: number;
  seed?: number;
}) {
  const r = rng(o.seed ?? 7);
  const B = 2000;
  const S = 250;
  let kg = 80;
  const truth: number[] = [];
  const days: BodyDay[] = [];
  const weighIns: WeighIn[] = [];
  for (let i = 0; i < o.n; i++) {
    const day = addDays(FROM, i);
    const T = i % 7 === 1 || i % 7 === 3 || i % 7 === 5 ? (o.training ?? 450) : 0;
    weighIns.push({ day, kg: kg + (o.noise ?? 0.6) * gauss(r), reliability: 1 });
    truth.push(kg);
    const home = o.eat + 250 * gauss(r);
    const out = r() < (o.eatOut ?? 0) ? 1000 + 200 * gauss(r) : 0;
    const balance = home + out - (o.c * B + o.cT * T + S);
    const d = bodyDensity(kg, prior.bodyFatPct);
    kg += balance / (balance < 0 ? d.loss : d.gain);
    const unlogged = r() < (o.unlogged ?? 0.1);
    const est = out * (o.estimates ?? 1);
    days.push({
      day,
      eatenKcal: unlogged ? null : home + est,
      estimatedKcal: unlogged ? 0 : est,
      closed: null,
      baseline: B,
      training: T,
      steps: S,
    });
  }
  return { days, weighIns, truth };
}

describe("density: not a flat 7,700", () => {
  it("follows Forbes: the more fat, the more of a change is fat", () => {
    expect(forbesFatShare(14.4)).toBeCloseTo(0.581, 3);
    expect(forbesFatShare(30)).toBeGreaterThan(forbesFatShare(14.4));
    expect(densityOf(1)).toBe(9440);
    expect(densityOf(0)).toBe(1820);
    expect(bodyDensity(80, 18).loss).toBeCloseTo(6244.5, 1);
  });
  it("is asymmetric when a leaner gain is given", () => {
    const d = bodyDensity(80, 18, 0.4);
    expect(d.gain).toBeLessThan(d.loss);
  });
  it("estimates body fat from BMI, age and sex (Deurenberg 1991)", () => {
    expect(estimatedBodyFatPct(80, 180, 30, "male")).toBeCloseTo(20.33, 2);
  });
});

describe("weigh-ins (v1 ADR-0027 rules)", () => {
  const facts = {
    said: { fasted: true, afterToilet: true, afterTraining: false },
    hour: 7,
    ateBeforeKcal: 0,
    trainedBefore: false,
    yesterday: null,
    usual: null,
  };
  it("standard is 1, unknown 0.75, clues multiply, never under 0.25", () => {
    expect(readWeighIn(facts).reliability).toBe(1);
    expect(readWeighIn({ ...facts, said: null }).reliability).toBe(0.75);
    expect(readWeighIn({ ...facts, ateBeforeKcal: 600, hour: 14 })).toEqual({
      clues: ["after_food", "late"],
      reliability: 0.35,
    });
    const all = {
      ...facts,
      said: { fasted: false, afterToilet: false, afterTraining: true },
      hour: 18,
    };
    expect(readWeighIn(all).reliability).toBe(0.25);
  });
  it("an implausible weigh-in counts 0.02, and never becomes the reference", () => {
    expect(readWeighIn({ ...facts, implausible: true }).reliability).toBe(0.02);
    const pts = [
      { day: "2026-10-07", kg: 76 },
      { day: "2026-10-08", kg: 86 },
      { day: "2026-10-09", kg: 76.2 },
    ];
    expect(implausibleWeighIns(pts)).toEqual([false, true, false]);
    expect(plausibleGap(76, 1)).toBe(2.5);
  });
});

describe("intake by day (ADR-0042)", () => {
  const base = { estimatedKcal: 0, baseline: 2000, training: 0, steps: 250 };
  it("half-logged and unlogged days are filled from the trusted days around them", () => {
    const days: BodyDay[] = [
      { ...base, day: "2026-10-01", eatenKcal: 2400, closed: null },
      { ...base, day: "2026-10-02", eatenKcal: 900, closed: null },
      { ...base, day: "2026-10-03", eatenKcal: null, closed: null },
      {
        ...base,
        day: "2026-10-04",
        eatenKcal: 2000,
        closed: "complete",
        estimatedKcal: 800,
      },
    ];
    const i = intakeOf(days);
    expect(i.get("2026-10-01")!.kind).toBe("likely");
    expect(i.get("2026-10-02")).toMatchObject({ kind: "half", weighed: 2200 });
    expect(i.get("2026-10-03")).toMatchObject({ kind: "none", weighed: 2200, sd: 770 });
    expect(i.get("2026-10-04")).toMatchObject({
      kind: "complete",
      weighed: 1200,
      estimated: 800,
    });
  });
});

describe("bodyState on simulated people", () => {
  it("no weigh-ins: no days, the priors", () => {
    const s = bodyState(simulate({ n: 10, c: 1, cT: 1, eat: 2500 }).days, [], prior);
    expect(s.days).toEqual([]);
    expect(s.c).toEqual({ value: 1, sigma: 0.12 });
  });
  it("finds the baseline factor and the expenditure, on every seed", () => {
    const real = 0.9 * 2000 + (0.75 * 450 * 3) / 7 + 250;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const sim = simulate({ n: 150, c: 0.9, cT: 0.75, eat: 2100, seed });
      const s = bodyState(sim.days, sim.weighIns, prior);
      expect(Math.abs(s.c.value - 0.9)).toBeLessThan(Math.max(0.04, 2 * s.c.sigma));
      expect(s.c.sigma).toBeLessThan(0.05);
      const week = s.days.slice(-7).reduce((a, d) => a + d.expenditure.value, 0) / 7;
      expect(Math.abs(week - real) / real).toBeLessThan(0.04);
      expect(s.days.at(-1)!.expenditure.sigma).toBeGreaterThan(0);
    }
  });
  it("training's factor is weakly identifiable from the scale, but the expenditure stays right", () => {
    // Truth: training costs 0.6 of its prior. A session is ≈ 0.1 kg, under the water noise,
    // and c's weekly drift absorbs slow changes: cT stays near its prior, with a wide σ that says so.
    const real = 1.05 * 2000 + (0.6 * 700 * 3) / 7 + 250;
    for (const seed of [1, 2, 3, 4, 5]) {
      const sim = simulate({ n: 240, c: 1.05, cT: 0.6, eat: 2600, training: 700, seed });
      const s = bodyState(sim.days, sim.weighIns, prior);
      expect(Math.abs(s.cTrain.value - 0.6)).toBeLessThan(2.5 * s.cTrain.sigma);
      expect(s.cTrain.sigma).toBeGreaterThan(0.18);
      expect(s.cTrain.sigma).toBeGreaterThan(3 * s.c.sigma);
      const week = s.days.slice(-7).reduce((a, d) => a + d.expenditure.value, 0) / 7;
      expect(Math.abs(week - real) / real).toBeLessThan(0.04);
    }
  });
  it("the trend weight is closer to the truth than the scale", () => {
    const sim = simulate({ n: 120, c: 1, cT: 1, eat: 2300, noise: 0.8, seed: 11 });
    const trend = trendWeight(bodyState(sim.days, sim.weighIns, prior));
    const rms = (xs: number[]) =>
      Math.sqrt(xs.reduce((a, x) => a + x * x, 0) / xs.length);
    const late = sim.weighIns.map((w, i) => ({ w, real: sim.truth[i]! })).slice(30);
    const scale = rms(late.map(({ w, real }) => w.kg - real));
    const filtered = rms(late.map(({ w, real }) => trend.get(w.day)! - real));
    expect(filtered).toBeLessThan(scale / 2);
  });
  it("k (meals out logged short) moves slowly from its prior; the truth stays within its σ", () => {
    const ks = [1, 2, 3, 4, 5].map((seed) => {
      const sim = simulate({
        n: 180,
        c: 1,
        cT: 1,
        eat: 1700,
        eatOut: 0.35,
        estimates: 0.75,
        seed,
      });
      const k = bodyState(sim.days, sim.weighIns, prior).k!;
      expect(Math.abs(k.value - 1 / 0.75)).toBeLessThan(2.5 * k.sigma);
      expect(k.sigma).toBeLessThan(0.15);
      return k.value;
    });
    expect(ks.reduce((a, k) => a + k, 0) / ks.length).toBeGreaterThan(1.15);
  });
  it("k is not learnt when estimates are more than half the log", () => {
    const sim = simulate({ n: 60, c: 1, cT: 1, eat: 600, eatOut: 1, estimates: 1.5 });
    expect(bodyState(sim.days, sim.weighIns, prior).k).toBeNull();
  });
  it("an implausible weigh-in barely moves the trend", () => {
    const sim = simulate({ n: 40, c: 1, cT: 1, eat: 2300, seed: 2 });
    const typo = sim.weighIns.map((w, i) =>
      i === 30 ? { ...w, kg: w.kg + 10, reliability: 0.02 } : w,
    );
    const a = trendWeight(bodyState(sim.days, sim.weighIns, prior));
    const b = trendWeight(bodyState(sim.days, typo, prior));
    const day = sim.weighIns[30]!.day;
    expect(Math.abs(b.get(day)! - a.get(day)!)).toBeLessThan(0.2);
  });
});
