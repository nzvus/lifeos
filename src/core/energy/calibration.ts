/**
 * core/energy/calibration.ts — what you really spend, learnt from the scale
 * and the log (ADR-0041, refined by ADR-0042). Pure: the repository
 * gathers the days.
 *
 * The model (core/energy/energy.ts) is the prior: each day it estimates the
 * everyday baseline B (BMR × activity) and the rest O (walking, training).
 * The body is taken to spend c × B + O, and c — the factor on the baseline,
 * the least certain part — is learnt with a Kalman filter over three
 * things: the body's weight W (without water), c, and k, how far your
 * ESTIMATES are from what you really ate (ADR-0042):
 *
 *   each day     W moves by (weighed food + k × estimates − O − c × B)
 *                ÷ 7,700, give or take what the day's intake is unsure of
 *   each weigh-in pulls W toward the scale by its reliability (ADR-0027;
 *                an implausible one counts ~0), and through W, c and k
 *   c            starts at 1 ± 0.12 (the model) and may drift ±0.015 a week
 *   k            starts at 1.15 ± 0.15: big meals and meals out are
 *                usually underestimated (Wansink & Chandon 2006; Urban
 *                2011); learnt apart from c because estimates come on
 *                some days only — so only while they are at most half of
 *                the logged kcal; beyond that k is 1 (the log is the
 *                estimates) and they just count as less sure
 *
 * How sure each day's intake is (ADR-0042, the developer: "the estimates
 * weigh the most: imprecise, and big, because you eat out"):
 *
 *   closed complete   what was logged: ±10 % on weighed food, ±30 % on
 *                     estimates (typed totals)
 *   closed partial    at least what was logged, else the days around it; ±30 %
 *   not closed        logged ≥ 60 % of what the day costs: as complete,
 *                     plus ±10 %; under 60 %: as partial (a dinner not
 *                     entered yet is not a deficit)
 *   not logged        the average of the trusted days within ± 7 days; ±35 %
 *
 * So a dinner out estimated at 1,400 kcal moves c little, and the scale on
 * the following days more. A factor is PROPOSED only when known within
 * ± 0.05 and different from the accepted one; it applies from the day it
 * is accepted (ADR-0026). Never applied silently. A steady under-logging is
 * not corrected for: the targets are met in logged numbers, so it cancels.
 */

export const WINDOW_DAYS = 84;
/** kcal in a kilo of body weight change (the usual estimate; ADR-0041). */
const KCAL_PER_KG = 7700;
const MIN_WEIGH_INS = 6;
const MIN_WEIGH_SPAN = 14;
const MIN_TRUSTED = 14;
const MIN_TRUSTED_SHARE = 0.5;
/** Logged below this share of the day's cost: probably half-logged. */
const COMPLETE_SHARE = 0.6;
const FILL_DAYS = 7;
const PRIOR_SIGMA = 0.12;
const ESTIMATE_PRIOR = 1.15;
const ESTIMATE_PRIOR_SIGMA = 0.15;
/** Above this share of estimated kcal, c and k can't be told apart. */
const MAX_ESTIMATED_SHARE = 0.5;
const DRIFT_PER_DAY = 0.015 ** 2 / 7;
/** The scale's day-to-day water, kg; doubled in variance: it lasts a few days. */
const SCALE_SIGMA = 0.6;
const CORRELATION = 2;
const START_SIGMA_KG = 1;
/** Relative uncertainty of intake (ADR-0042). */
const WEIGHED_ERROR = 0.1;
const ESTIMATE_ERROR = 0.3;
const PARTIAL_ERROR = 0.3;
const UNCLOSED_EXTRA = 0.1;
const UNLOGGED_ERROR = 0.35;
/** Uncertainty under which a factor is proposed. */
export const CONFIDENT = 0.05;
/** What `energy_corrections` accepts (its check constraint). */
export const CORRECTION_RANGE = [0.8, 1.2] as const;
/** Below this change the accepted factor already fits: nothing to propose. */
const NOTICEABLE = 0.02;

export type CalibrationDay = {
  day: string;
  /** kcal eaten, or null when nothing eaten was logged. */
  eatenKcal: number | null;
  /** Of which from estimates (typed totals rather than weighed food), kcal. */
  estimatedKcal: number;
  /** ADR-0042: the user closed the day (complete / partial), or not. */
  closed: "complete" | "partial" | null;
  /** The model's everyday baseline (midpoint, WITHOUT any correction), kcal. */
  baseline: number | null;
  /** The model's walking and done training (midpoints), kcal. */
  other: number | null;
};

export type Verdict = "ok" | "no_body" | "few_weigh_ins" | "few_logged";

export type Calibration = {
  verdict: Verdict;
  days: number;
  loggedDays: number;
  /** Days closed by the user (complete or partial). */
  closedDays: number;
  /** Logged days not closed and under 60 % of their cost: taken as half-logged. */
  incompleteDays: number;
  /** Share of the logged kcal that came from estimates, 0–1. */
  estimatedShare: number;
  weighIns: number;
  /** Weeks of data the factor was learnt from (0 = not enough yet). */
  weeks: number;
  /** kg per week over the last 14 days, + gaining; null without data. */
  trendKgPerWeek: number | null;
  /** Average eaten on trusted days of the last 14 days, kcal. */
  intake: number | null;
  /** What the scale says was spent over the same days, kcal/day. */
  observed: number | null;
  /** What the model said for the same days, with the accepted factor, kcal/day. */
  estimated: number | null;
  /** The learnt factor on the baseline and its uncertainty (one σ). */
  factor: number;
  sigma: number;
  /** ADR-0042: what your estimates really are, × logged (± σ); null without estimates. */
  estimateFactor: { k: number; sigma: number } | null;
  /** Average daily expenditure of the last 7 days with the learnt factor, ± 1 σ. */
  expenditure: { mid: number; low: number; high: number } | null;
  current: number;
  /** The factor to accept; null unless known well enough and different. */
  proposed: number | null;
};

const mean = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length;
const dayIndex = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86_400_000;

export type WeighInPoint = {
  day: string;
  kg: number;
  /** 0.02–1 (ADR-0027); absent = 1. */
  weight?: number;
};

/**
 * Weighted least-squares slope, kg per day; null with fewer than 2 points
 * or one day.
 */
export function weightSlope(points: readonly WeighInPoint[]): number | null {
  if (points.length < 2) return null;
  const ws = points.map((p) => p.weight ?? 1);
  const sw = ws.reduce((a, w) => a + w, 0);
  const xs = points.map((p) => dayIndex(p.day));
  const ys = points.map((p) => p.kg);
  const mx = xs.reduce((a, x, i) => a + ws[i]! * x, 0) / sw;
  const my = ys.reduce((a, y, i) => a + ws[i]! * y, 0) / sw;
  const sxx = xs.reduce((a, x, i) => a + ws[i]! * (x - mx) ** 2, 0);
  if (sxx === 0) return null;
  return xs.reduce((a, x, i) => a + ws[i]! * (x - mx) * (ys[i]! - my), 0) / sxx;
}

const round = (x: number | null, d = 0) =>
  x === null ? null : Math.round(x * 10 ** d) / 10 ** d;

type Kind = "complete" | "partial" | "likely" | "half" | "none";

/** How a day's log is read (see the header). */
function kindOf(d: CalibrationDay, cost: number): Kind {
  if (d.closed === "complete") return d.eatenKcal === null ? "partial" : "complete";
  if (d.closed === "partial") return "partial";
  if (d.eatenKcal === null) return "none";
  return d.eatenKcal >= COMPLETE_SHARE * cost ? "likely" : "half";
}

type Mat = number[][];
const zero3 = (): Mat => [
  [0, 0, 0],
  [0, 0, 0],
  [0, 0, 0],
];

export function calibrate(
  days: readonly CalibrationDay[],
  weighIns: readonly WeighInPoint[],
  current: number,
): Calibration {
  const cost = (d: CalibrationDay, c: number) => c * d.baseline! + d.other!;
  const modelled = days.filter((d) => d.baseline !== null && d.other !== null);
  // From the first logged (or closed) day: the days before it say nothing.
  const start = modelled.find((d) => d.eatenKcal !== null || d.closed)?.day;
  const usable = start ? modelled.filter((d) => d.day >= start) : [];
  const kinds = new Map(usable.map((d) => [d.day, kindOf(d, cost(d, current))]));
  const trusted = usable.filter((d) => {
    const k = kinds.get(d.day);
    return k === "complete" || k === "likely";
  });
  const points = weighIns.filter(
    (w) => (w.weight ?? 1) >= 0.1 && start !== undefined && w.day >= start,
  );
  const span = points.length
    ? dayIndex(points.at(-1)!.day) - dayIndex(points[0]!.day)
    : 0;
  const loggedKcal = usable.reduce((a, d) => a + (d.eatenKcal ?? 0), 0);
  const share = loggedKcal
    ? usable.reduce((a, d) => a + Math.min(d.estimatedKcal, d.eatenKcal ?? 0), 0) /
      loggedKcal
    : 0;

  const verdict: Verdict = !modelled.length
    ? "no_body"
    : !usable.length
      ? "few_logged"
      : points.length < MIN_WEIGH_INS || span < MIN_WEIGH_SPAN
        ? "few_weigh_ins"
        : trusted.length < MIN_TRUSTED ||
            trusted.length < MIN_TRUSTED_SHARE * usable.length
          ? "few_logged"
          : "ok";

  let c = 1;
  let sigma = PRIOR_SIGMA;
  let estimateK: { k: number; sigma: number } | null = null;
  if (verdict === "ok") {
    const all = trusted.map((d) => d.eatenKcal!);
    const nearby = (d: CalibrationDay) => {
      const near = trusted.filter(
        (x) => Math.abs(dayIndex(x.day) - dayIndex(d.day)) <= FILL_DAYS,
      );
      return mean(near.length ? near.map((x) => x.eatenKcal!) : all);
    };
    /**
     * The day's intake as [weighed part, estimated part, sd]: estimates are
     * multiplied by k in the filter; filled-in days count as weighed.
     */
    const intakeOf = (d: CalibrationDay): [number, number, number] => {
      const eaten = d.eatenKcal ?? 0;
      const est = Math.min(d.estimatedKcal, eaten);
      const logged = Math.hypot(WEIGHED_ERROR * (eaten - est), ESTIMATE_ERROR * est);
      switch (kinds.get(d.day)!) {
        case "complete":
          return [eaten - est, est, logged];
        case "likely":
          return [eaten - est, est, Math.hypot(logged, UNCLOSED_EXTRA * eaten)];
        case "partial":
        case "half": {
          const i = Math.max(eaten, nearby(d));
          return [i, 0, PARTIAL_ERROR * i];
        }
        case "none": {
          const i = nearby(d);
          return [i, 0, UNLOGGED_ERROR * i];
        }
      }
    };

    // The filter starts on the first weigh-in. State x = [W, c, k].
    const byDay = new Map<string, WeighInPoint[]>();
    for (const p of points) byDay.set(p.day, [...(byDay.get(p.day) ?? []), p]);
    const learnK = share <= MAX_ESTIMATED_SHARE;
    const x = [points[0]!.kg, 1, learnK ? ESTIMATE_PRIOR : 1];
    let P = zero3();
    P[0]![0] = START_SIGMA_KG ** 2;
    P[1]![1] = PRIOR_SIGMA ** 2;
    P[2]![2] = learnK ? ESTIMATE_PRIOR_SIGMA ** 2 : 0;
    for (const d of usable.filter((y) => y.day >= points[0]!.day)) {
      // Morning: the weigh-ins of the day (before its food). H = [1, 0, 0].
      for (const p of byDay.get(d.day) ?? []) {
        const r = (SCALE_SIGMA ** 2 * CORRELATION) / (p.weight ?? 1);
        const s0 = P[0]![0]! + r;
        const gain = [P[0]![0]! / s0, P[1]![0]! / s0, P[2]![0]! / s0];
        const innovation = p.kg - x[0]!;
        for (let a = 0; a < 3; a++) x[a]! += gain[a]! * innovation;
        const row0 = [...P[0]!];
        P = P.map((row, a) => row.map((v, b) => v - gain[a]! * row0[b]!));
      }
      // The day: W += (weighed + k·est − O − c·B)/ρ. Linear in (c, k) with
      // the day's numbers as coefficients: F = [[1, −B/ρ, est/ρ], I].
      const [weighed, est, sd] = intakeOf(d);
      const fc = -d.baseline! / KCAL_PER_KG;
      const fk = est / KCAL_PER_KG;
      x[0] = x[0]! + (weighed - d.other!) / KCAL_PER_KG + fc * x[1]! + fk * x[2]!;
      const F: Mat = [
        [1, fc, fk],
        [0, 1, 0],
        [0, 0, 1],
      ];
      const FP = F.map((row) =>
        [0, 1, 2].map((b) => row.reduce((a, v, m) => a + v * P[m]![b]!, 0)),
      );
      P = FP.map((row) =>
        [0, 1, 2].map((b) => row.reduce((a, v, m) => a + v * F[b]![m]!, 0)),
      );
      P[0]![0]! += (sd / KCAL_PER_KG) ** 2;
      P[1]![1]! += DRIFT_PER_DAY;
    }
    c = x[1]!;
    if (learnK) estimateK = { k: x[2]!, sigma: Math.sqrt(P[2]![2]!) };
    sigma = Math.sqrt(P[1]![1]!);
  }
  c = Math.min(CORRECTION_RANGE[1], Math.max(CORRECTION_RANGE[0], c));

  // The last 14 days, for display: intake, trend, what the scale says.
  const end = usable.at(-1)?.day;
  const recentDays = end
    ? trusted.filter((d) => dayIndex(end) - dayIndex(d.day) < 14)
    : [];
  const recentPoints = end
    ? points.filter((p) => dayIndex(end) - dayIndex(p.day) < 14)
    : [];
  const slope = recentPoints.length >= 3 ? weightSlope(recentPoints) : null;
  const intake = recentDays.length ? mean(recentDays.map((d) => d.eatenKcal!)) : null;
  const week = usable.slice(-7);
  const expenditure =
    verdict === "ok" && week.length
      ? {
          mid: Math.round(mean(week.map((d) => cost(d, c)))),
          low: Math.round(mean(week.map((d) => cost(d, c - sigma)))),
          high: Math.round(mean(week.map((d) => cost(d, c + sigma)))),
        }
      : null;
  const factor = Math.round(c * 100) / 100;
  return {
    verdict,
    days: days.length,
    loggedDays: usable.filter((d) => d.eatenKcal !== null).length,
    closedDays: usable.filter((d) => d.closed !== null).length,
    incompleteDays: usable.filter((d) => kinds.get(d.day) === "half").length,
    estimatedShare: Math.round(share * 100) / 100,
    weighIns: weighIns.length,
    weeks: verdict === "ok" ? Math.floor(span / 7) : 0,
    trendKgPerWeek: round(slope === null ? null : slope * 7, 2),
    intake: round(intake),
    observed: round(
      intake !== null && slope !== null ? intake - slope * KCAL_PER_KG : null,
    ),
    estimated: recentDays.length
      ? Math.round(mean(recentDays.map((d) => cost(d, current))))
      : null,
    factor,
    sigma: Math.round(sigma * 1000) / 1000,
    // Only when estimates were logged: else k is just its prior.
    estimateFactor:
      estimateK && usable.some((d) => d.estimatedKcal > 0)
        ? {
            k: Math.round(estimateK.k * 100) / 100,
            sigma: Math.round(estimateK.sigma * 100) / 100,
          }
        : null,
    expenditure,
    current,
    proposed:
      verdict === "ok" && sigma <= CONFIDENT && Math.abs(factor - current) >= NOTICEABLE
        ? factor
        : null,
  };
}
