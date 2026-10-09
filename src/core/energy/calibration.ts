/**
 * core/energy/calibration.ts — what you really spend, learnt from the scale
 * and the log (ADR-0041, replacing ADR-0020's 28-day average). Pure: the
 * repository gathers the days.
 *
 * The model (core/energy/energy.ts) is the prior: each day it estimates the
 * everyday baseline B (BMR × activity) and the rest O (walking, training).
 * The body is taken to spend c × B + O, and c — the factor on the baseline,
 * the least certain part — is learnt from ALL the window at once:
 *
 *   each weigh-in = the starting weight
 *                   + (everything eaten − everything spent before it) ÷ 7,700
 *   so  W_t − (ΣI − ΣO)/7,700  =  W0  −  c × ΣB/7,700
 *
 * a straight line in c, fitted by weighted least squares: each weigh-in by
 * its reliability (ADR-0027; an implausible one counts ~0) and by how
 * recent it is (half-weight after 60 days, so a changing body is followed).
 * One long fit uses the data far better than slopes of short windows: the
 * error of a trend falls with the length of the period to the power 1.5.
 *
 *   intake  logged days; a day logged under 60 % of what it should cost is
 *           taken as half-logged (a dinner not entered yet). Those and the
 *           unlogged days count as the average of the complete days around
 *           them (± 7 days), as MacroFactor does.
 *   prior   c = 1 ± 0.12: with little data the answer stays near the model;
 *           the uncertainty shrinks as data comes in.
 *
 * A factor is PROPOSED only when it is known within ± 0.04 and differs from
 * the accepted one; it applies from the day it is accepted (ADR-0026).
 * Never applied silently. A steady under-logging is not corrected for: the
 * targets are met in logged numbers, so it cancels out.
 */

export const WINDOW_DAYS = 84;
/** kcal in a kilo of body weight change (the usual estimate; ADR-0041). */
const KCAL_PER_KG = 7700;
const MIN_WEIGH_INS = 6;
const MIN_WEIGH_SPAN = 14;
const MIN_COMPLETE = 14;
const MIN_COMPLETE_SHARE = 0.5;
/** Logged below this share of the day's cost: probably half-logged. */
const COMPLETE_SHARE = 0.6;
const FILL_DAYS = 7;
const HALF_LIFE_DAYS = 60;
const PRIOR_SIGMA = 0.12;
/** Day-to-day water is correlated over a few days: the fit is less sure than it looks. */
const CORRELATION = 2;
/** Scale noise when the residuals can't say (too few weigh-ins), kg. */
const SCALE_NOISE_KG = 0.4;
/** Uncertainty under which a factor is proposed. */
export const CONFIDENT = 0.04;
/** What `energy_corrections` accepts (its check constraint). */
export const CORRECTION_RANGE = [0.8, 1.2] as const;
/** Below this change the accepted factor already fits: nothing to propose. */
const NOTICEABLE = 0.02;

export type CalibrationDay = {
  day: string;
  /** kcal eaten, or null when nothing eaten was logged (the day is skipped). */
  eatenKcal: number | null;
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
  /** Logged days left out as probably half-logged. */
  incompleteDays: number;
  weighIns: number;
  /** Weeks of data the factor was learnt from (0 = not enough yet). */
  weeks: number;
  /** kg per week over the last 14 days, + gaining; null without data. */
  trendKgPerWeek: number | null;
  /** Average eaten on complete logged days of the last 14 days, kcal. */
  intake: number | null;
  /** What the scale says was spent over the same days, kcal/day. */
  observed: number | null;
  /** What the model said for the same days, with the accepted factor, kcal/day. */
  estimated: number | null;
  /** The learnt factor on the baseline and its uncertainty (one σ). */
  factor: number;
  sigma: number;
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

export function calibrate(
  days: readonly CalibrationDay[],
  weighIns: readonly WeighInPoint[],
  current: number,
): Calibration {
  const cost = (d: CalibrationDay, c: number) => c * d.baseline! + d.other!;
  const modelled = days.filter((d) => d.baseline !== null && d.other !== null);
  // From the first logged day: the days before it say nothing yet.
  const start = modelled.find((d) => d.eatenKcal !== null)?.day;
  const usable = start ? modelled.filter((d) => d.day >= start) : [];
  // Complete = logged and at least 60 % of what the day should cost (at the
  // accepted factor: the learnt one isn't known yet).
  const complete = new Set(
    usable
      .filter(
        (d) => d.eatenKcal !== null && d.eatenKcal >= COMPLETE_SHARE * cost(d, current),
      )
      .map((d) => d.day),
  );
  const loggedDays = usable.filter((d) => d.eatenKcal !== null).length;
  const incompleteDays = loggedDays - complete.size;
  const points = weighIns.filter(
    (w) => (w.weight ?? 1) >= 0.1 && usable.some((d) => d.day <= w.day),
  );
  const span = points.length
    ? dayIndex(points.at(-1)!.day) - dayIndex(points[0]!.day)
    : 0;

  const verdict: Verdict = !modelled.length
    ? "no_body"
    : !usable.length
      ? "few_logged"
      : points.length < MIN_WEIGH_INS || span < MIN_WEIGH_SPAN
        ? "few_weigh_ins"
        : complete.size < MIN_COMPLETE ||
            complete.size < MIN_COMPLETE_SHARE * usable.length
          ? "few_logged"
          : "ok";

  let c = 1;
  let sigma = PRIOR_SIGMA;
  if (verdict === "ok") {
    // Each day's intake: logged if complete, else the average of the
    // complete days within ± 7 days (else of all complete days).
    const all = usable.filter((d) => complete.has(d.day)).map((d) => d.eatenKcal!);
    const intakeOf = (d: CalibrationDay) => {
      if (complete.has(d.day)) return d.eatenKcal!;
      const near = usable.filter(
        (x) =>
          complete.has(x.day) && Math.abs(dayIndex(x.day) - dayIndex(d.day)) <= FILL_DAYS,
      );
      return mean(near.length ? near.map((x) => x.eatenKcal!) : all);
    };
    // Running sums BEFORE each day (a morning weigh-in sees the days before).
    const sums = new Map<string, { io: number; b: number }>();
    let io = 0;
    let b = 0;
    for (const d of usable) {
      sums.set(d.day, { io, b });
      io += intakeOf(d) - d.other!;
      b += d.baseline!;
    }
    const lastDay = dayIndex(usable.at(-1)!.day);
    const rows = points
      .filter((p) => sums.has(p.day))
      .map((p) => {
        const s = sums.get(p.day)!;
        return {
          x: -s.b / KCAL_PER_KG,
          y: p.kg - s.io / KCAL_PER_KG,
          w: (p.weight ?? 1) * 0.5 ** ((lastDay - dayIndex(p.day)) / HALF_LIFE_DAYS),
        };
      });
    const sw = rows.reduce((a, r) => a + r.w, 0);
    const mx = rows.reduce((a, r) => a + r.w * r.x, 0) / sw;
    const my = rows.reduce((a, r) => a + r.w * r.y, 0) / sw;
    const sxx = rows.reduce((a, r) => a + r.w * (r.x - mx) ** 2, 0);
    if (sxx > 0) {
      const cFit = rows.reduce((a, r) => a + r.w * (r.x - mx) * (r.y - my), 0) / sxx;
      const resid =
        rows.length > 2
          ? rows.reduce((a, r) => a + r.w * (r.y - my - cFit * (r.x - mx)) ** 2, 0) /
            (sw * (1 - 2 / rows.length))
          : 0;
      // Weights are relative precisions: the scatter of a weight-1 weigh-in.
      const noise = Math.max(Math.sqrt(resid), SCALE_NOISE_KG);
      const varFit = (noise ** 2 / sxx) * CORRELATION;
      // With the prior (the model, c = 1).
      const prec = 1 / varFit + 1 / PRIOR_SIGMA ** 2;
      c = (cFit / varFit + 1 / PRIOR_SIGMA ** 2) / prec;
      sigma = Math.sqrt(1 / prec);
    }
  }
  c = Math.min(CORRECTION_RANGE[1], Math.max(CORRECTION_RANGE[0], c));

  // The last 14 days, for display: intake, trend, what the scale says.
  const end = usable.at(-1)?.day;
  const recentDays = end
    ? usable.filter((d) => dayIndex(end) - dayIndex(d.day) < 14 && complete.has(d.day))
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
    loggedDays,
    incompleteDays,
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
    expenditure,
    current,
    proposed:
      verdict === "ok" && sigma <= CONFIDENT && Math.abs(factor - current) >= NOTICEABLE
        ? factor
        : null,
  };
}
