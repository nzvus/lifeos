/**
 * core/energy/calibration.ts — does the energy model fit THIS body?
 * (ADR-0020). Pure: the repository gathers the window's days.
 *
 * Over a window (28 days ending yesterday) the scale and the log tell what
 * was really spent:
 *
 *   observed = average eaten (logged days) − weight trend × 7700 kcal/kg
 *
 * The trend is the least-squares slope of every weigh-in, not two single
 * weigh-ins (water swings a kilo a day). The model's estimate for the same
 * days (what was done, midpoint) is compared with it; the gap becomes a
 * proposed factor on the everyday baseline — the most uncertain part — that
 * the user accepts or not. Never applied silently.
 */
import type { Energy } from "./energy";

export const WINDOW_DAYS = 28;
/** kcal in a kilo of body weight change (mostly fat; the usual estimate). */
const KCAL_PER_KG = 7700;
const MIN_WEIGH_INS = 6;
const MIN_SPAN_DAYS = 21;
const MIN_LOGGED_SHARE = 0.8;
export const CORRECTION_RANGE = [0.8, 1.2] as const;
/** Below this change the model already fits: nothing to propose. */
const NOTICEABLE = 0.02;

export type CalibrationDay = {
  day: string;
  /** kcal eaten, or null when nothing eaten was logged (the day is skipped). */
  eatenKcal: number | null;
  /** The model's estimate for the day, with the current correction. */
  energy: Energy | null;
};

export type Verdict = "ok" | "no_body" | "few_weigh_ins" | "few_logged";

export type Calibration = {
  verdict: Verdict;
  days: number;
  loggedDays: number;
  weighIns: number;
  /** kg per week, + gaining; null with fewer than 2 weigh-ins. */
  trendKgPerWeek: number | null;
  /** Average eaten on logged days, kcal. */
  intake: number | null;
  /** What the scale says was spent, kcal/day. */
  observed: number | null;
  /** What the model said for the same days (midpoint), kcal/day. */
  estimated: number | null;
  current: number;
  /** The factor to accept; null unless the verdict is ok and it changes something. */
  proposed: number | null;
};

const mean = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length;
const dayIndex = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86_400_000;

/** Least-squares slope, kg per day; null with fewer than 2 points or one day. */
export function weightSlope(
  points: readonly { day: string; kg: number }[],
): number | null {
  if (points.length < 2) return null;
  const xs = points.map((p) => dayIndex(p.day));
  const ys = points.map((p) => p.kg);
  const mx = mean(xs);
  const my = mean(ys);
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  if (sxx === 0) return null;
  return xs.reduce((a, x, i) => a + (x - mx) * (ys[i]! - my), 0) / sxx;
}

const round = (x: number | null) => (x === null ? null : Math.round(x));

export function calibrate(
  days: readonly CalibrationDay[],
  weighIns: readonly { day: string; kg: number }[],
  current: number,
): Calibration {
  const logged = days.filter((d) => d.eatenKcal !== null && d.energy !== null);
  const slope = weightSlope(weighIns);
  const span =
    weighIns.length > 1
      ? dayIndex(weighIns[weighIns.length - 1]!.day) - dayIndex(weighIns[0]!.day)
      : 0;
  const intake = logged.length ? mean(logged.map((d) => d.eatenKcal!)) : null;
  const observed =
    intake !== null && slope !== null ? intake - slope * KCAL_PER_KG : null;
  const mid = (r: { low: number; high: number }) => (r.low + r.high) / 2;
  const estimated = logged.length
    ? mean(logged.map((d) => mid(d.energy!.total.done)))
    : null;
  const baseline = logged.length
    ? mean(logged.map((d) => mid(d.energy!.baseline)))
    : null;

  const verdict: Verdict = days.every((d) => d.energy === null)
    ? "no_body"
    : weighIns.length < MIN_WEIGH_INS || span < MIN_SPAN_DAYS
      ? "few_weigh_ins"
      : logged.length < Math.ceil(days.length * MIN_LOGGED_SHARE)
        ? "few_logged"
        : "ok";

  let proposed: number | null = null;
  if (verdict === "ok" && observed !== null && estimated !== null && baseline) {
    // The whole gap goes to the baseline, the least certain part.
    const target = baseline + (observed - estimated);
    const raw = (current * target) / baseline;
    const factor =
      Math.round(
        Math.min(CORRECTION_RANGE[1], Math.max(CORRECTION_RANGE[0], raw)) * 100,
      ) / 100;
    if (Math.abs(factor - current) >= NOTICEABLE) proposed = factor;
  }

  return {
    verdict,
    days: days.length,
    loggedDays: logged.length,
    weighIns: weighIns.length,
    trendKgPerWeek: slope === null ? null : Math.round(slope * 7 * 100) / 100,
    intake: round(intake),
    observed: round(observed),
    estimated: round(estimated),
    current,
    proposed,
  };
}
