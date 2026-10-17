/**
 * E4 Body state — one Kalman filter per person over the whole history
 * (engines.md E4; v1 ADR-0041/0042 generalised). State x = [W, c, cT, k]:
 *   W    the weight without the scale's water noise, kg
 *   c    factor on the everyday baseline B (the least certain prior)
 *   cT   factor on training T (what the person compensates, Careau 2021)
 *   k    how far estimated food is from what was really eaten
 * Each day:   W += (weighed + k·estimated − c·B − cT·T − S) / ρ
 *   ρ is the density of a loss or of a gain, by the sign of the day's
 *   predicted balance (density.ts), from the fat mass at today's W.
 * Each weigh-in pulls W toward the scale by its reliability (weigh-in.ts),
 * and through W the factors; the morning weigh-in comes before the day's food.
 * How sure each day's intake is (ADR-0042, kept):
 *   closed complete  logged: ±10 % weighed, ±30 % estimates
 *   closed partial   at least what was logged, else the days around it; ±30 %
 *   not closed       logged ≥ 60 % of the day's prior cost: as complete, plus ±10 %;
 *                    under 60 %: as partial (a dinner not entered yet is no deficit)
 *   not logged       the mean of the trusted days within ± 7 days; ±35 %
 * k is learnt only while estimates are at most half the logged kcal; beyond
 * that c and k cannot be told apart, so k stays 1 and estimates count as less sure.
 * cT is weakly identifiable from the scale alone (a 700 kcal session is
 * ≈ 0.1 kg, under the water noise): its σ says how much the data told.
 * Outputs are used directly (no "accept a factor" step): the trend weight
 * and the expenditure, each ± σ, and the learnt factors.
 */
import type { IsoDate } from "../time/date";
import { daysBetween } from "../time/date";
import { bodyDensity } from "./density";

export type BodyDay = {
  day: IsoDate;
  /** kcal eaten, or null when nothing eaten was logged. */
  eatenKcal: number | null;
  /** Of which estimates (typed totals rather than weighed food), kcal. */
  estimatedKcal: number;
  closed: "complete" | "partial" | null;
  /** The priors (E4a), kcal: everyday baseline, training, steps. */
  baseline: number;
  training: number;
  steps: number;
};

export type WeighIn = { day: IsoDate; kg: number; reliability: number };

export type BodyPrior = {
  /** Measured, or estimated (density.ts `estimatedBodyFatPct`). */
  bodyFatPct: number;
  /** A leaner fat share for a gain, when E6 knows the gain is trained. */
  gainFatShare?: number | undefined;
};

export type Estimate = { value: number; sigma: number };
export type IntakeKind = "complete" | "likely" | "partial" | "half" | "none";

export type BodyStateDay = {
  day: IsoDate;
  /** The trend weight that morning, after its weigh-ins. */
  weight: Estimate;
  /** What the day cost: c·B + cT·T + S with the factors learnt so far. */
  expenditure: Estimate;
  intake: Estimate & { kind: IntakeKind };
};

export type BodyState = {
  /** One per day from the first weigh-in on; empty without weigh-ins. */
  days: BodyStateDay[];
  c: Estimate;
  cTrain: Estimate;
  /** Null while estimates are too large a share to tell k from c. */
  k: Estimate | null;
};

const SCALE_SIGMA = 0.6; // kg of day-to-day water
const CORRELATION = 2; // water lasts a few days: the variance counts double
const START_SIGMA_KG = 1;
const C_PRIOR = { value: 1, sigma: 0.12 };
const CT_PRIOR = { value: 1, sigma: 0.25 };
const K_PRIOR = { value: 1.15, sigma: 0.15 }; // meals out are underestimated (Wansink & Chandon 2006; Urban 2011)
/** c adapts (± 0.015 a week); cT, the compensation of training, is a trait and does not drift. */
const DRIFT_PER_DAY = 0.015 ** 2 / 7;
const MAX_ESTIMATED_SHARE = 0.5;
const COMPLETE_SHARE = 0.6;
const FILL_DAYS = 7;
const WEIGHED_ERROR = 0.1;
const ESTIMATE_ERROR = 0.3;
const PARTIAL_ERROR = 0.3;
const UNCLOSED_EXTRA = 0.1;
const UNLOGGED_ERROR = 0.35;

function kindOf(d: BodyDay): IntakeKind {
  if (d.closed === "complete") return d.eatenKcal === null ? "partial" : "complete";
  if (d.closed === "partial") return "partial";
  if (d.eatenKcal === null) return "none";
  const cost = d.baseline + d.training + d.steps;
  return d.eatenKcal >= COMPLETE_SHARE * cost ? "likely" : "half";
}

/** The day's intake as weighed part, estimated part (× k in the filter) and SD, kcal. */
export function intakeOf(
  days: readonly BodyDay[],
): Map<IsoDate, { weighed: number; estimated: number; sd: number; kind: IntakeKind }> {
  const kinds = new Map(days.map((d) => [d.day, kindOf(d)]));
  const trusted = days.filter((d) => ["complete", "likely"].includes(kinds.get(d.day)!));
  const mean = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length;
  const nearby = (d: BodyDay): number | null => {
    const near = trusted.filter((x) => Math.abs(daysBetween(x.day, d.day)) <= FILL_DAYS);
    const pool = near.length ? near : trusted;
    return pool.length ? mean(pool.map((x) => x.eatenKcal!)) : null;
  };
  const out = new Map<
    IsoDate,
    { weighed: number; estimated: number; sd: number; kind: IntakeKind }
  >();
  for (const d of days) {
    const kind = kinds.get(d.day)!;
    const eaten = d.eatenKcal ?? 0;
    const est = Math.min(d.estimatedKcal, eaten);
    const logged = Math.hypot(WEIGHED_ERROR * (eaten - est), ESTIMATE_ERROR * est);
    // With no trusted day at all, an unknown day is the prior cost, at its widest.
    const fill = () => nearby(d) ?? d.baseline + d.training + d.steps;
    switch (kind) {
      case "complete":
        out.set(d.day, { weighed: eaten - est, estimated: est, sd: logged, kind });
        break;
      case "likely":
        out.set(d.day, {
          weighed: eaten - est,
          estimated: est,
          sd: Math.hypot(logged, UNCLOSED_EXTRA * eaten),
          kind,
        });
        break;
      case "partial":
      case "half": {
        const i = Math.max(eaten, fill());
        out.set(d.day, { weighed: i, estimated: 0, sd: PARTIAL_ERROR * i, kind });
        break;
      }
      case "none": {
        const i = fill();
        out.set(d.day, { weighed: i, estimated: 0, sd: UNLOGGED_ERROR * i, kind });
      }
    }
  }
  return out;
}

type Mat = number[][];
const N = 4;
const eye = (): Mat =>
  Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => (i === j ? 1 : 0)),
  );
const mul = (a: Mat, b: Mat): Mat =>
  a.map((row) =>
    Array.from({ length: N }, (_, j) => row.reduce((s, v, m) => s + v * b[m]![j]!, 0)),
  );
const transpose = (a: Mat): Mat => a[0]!.map((_, j) => a.map((row) => row[j]!));

export function bodyState(
  days: readonly BodyDay[],
  weighIns: readonly WeighIn[],
  prior: BodyPrior,
): BodyState {
  const sorted = [...days].sort((a, b) => (a.day < b.day ? -1 : 1));
  const points = [...weighIns].sort((a, b) => (a.day < b.day ? -1 : 1));
  const logged = sorted.reduce((a, d) => a + (d.eatenKcal ?? 0), 0);
  const estimated = sorted.reduce(
    (a, d) => a + Math.min(d.estimatedKcal, d.eatenKcal ?? 0),
    0,
  );
  const learnK = logged > 0 && estimated / logged <= MAX_ESTIMATED_SHARE;
  const result = (x: number[], P: Mat, out: BodyStateDay[]): BodyState => ({
    days: out,
    c: { value: x[1]!, sigma: Math.sqrt(P[1]![1]!) },
    cTrain: { value: x[2]!, sigma: Math.sqrt(P[2]![2]!) },
    k: learnK && estimated > 0 ? { value: x[3]!, sigma: Math.sqrt(P[3]![3]!) } : null,
  });

  const x = [0, C_PRIOR.value, CT_PRIOR.value, learnK ? K_PRIOR.value : 1];
  let P = eye().map((row) => row.map(() => 0));
  P[0]![0] = START_SIGMA_KG ** 2;
  P[1]![1] = C_PRIOR.sigma ** 2;
  P[2]![2] = CT_PRIOR.sigma ** 2;
  P[3]![3] = learnK ? K_PRIOR.sigma ** 2 : 0;
  if (points.length === 0) return result(x, P, []);
  x[0] = points[0]!.kg;

  const intake = intakeOf(sorted);
  const byDay = new Map<IsoDate, WeighIn[]>();
  for (const p of points) byDay.set(p.day, [...(byDay.get(p.day) ?? []), p]);
  const out: BodyStateDay[] = [];
  for (const d of sorted.filter((y) => y.day >= points[0]!.day)) {
    // Morning: the day's weigh-ins. H = [1, 0, 0, 0].
    for (const p of byDay.get(d.day) ?? []) {
      const s = P[0]![0]! + (SCALE_SIGMA ** 2 * CORRELATION) / p.reliability;
      const gain = P.map((row) => row[0]! / s);
      const innovation = p.kg - x[0]!;
      for (let a = 0; a < N; a++) x[a]! += gain[a]! * innovation;
      const row0 = [...P[0]!];
      P = P.map((row, a) => row.map((v, b) => v - gain[a]! * row0[b]!));
    }
    const B = d.baseline;
    const T = d.training;
    const expenditure = x[1]! * B + x[2]! * T + d.steps;
    const varE = B * B * P[1]![1]! + T * T * P[2]![2]! + 2 * B * T * P[1]![2]!;
    const i = intake.get(d.day)!;
    out.push({
      day: d.day,
      weight: { value: x[0]!, sigma: Math.sqrt(P[0]![0]!) },
      expenditure: { value: expenditure, sigma: Math.sqrt(Math.max(0, varE)) },
      intake: { value: i.weighed + x[3]! * i.estimated, sigma: i.sd, kind: i.kind },
    });
    // The day: linear in (c, cT, k) with the day's numbers as coefficients.
    const balance = i.weighed + x[3]! * i.estimated - expenditure;
    const density = bodyDensity(x[0]!, prior.bodyFatPct, prior.gainFatShare);
    const rho = balance < 0 ? density.loss : density.gain;
    x[0] = x[0]! + balance / rho;
    const F = eye();
    F[0]![1] = -B / rho;
    F[0]![2] = -T / rho;
    F[0]![3] = i.estimated / rho;
    P = mul(mul(F, P), transpose(F));
    P[0]![0]! += (i.sd / rho) ** 2;
    P[1]![1]! += DRIFT_PER_DAY;
  }
  return result(x, P, out);
}

/** The trend weight by day, for E2's "per kg" and E5's targets. */
export function trendWeight(state: BodyState): Map<IsoDate, number> {
  return new Map(state.days.map((d) => [d.day, d.weight.value]));
}
