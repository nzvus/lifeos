/**
 * E6 Training — an exercise's progress as a trend, not a percentage
 * (dossiers/training.md §5.2). v1 compared one session with another; the
 * developer's e1RM moves ±14 % (SD) between sessions, so one session says
 * little. Here:
 *   window    the last 6 weeks of sessions, restarted after a gap > 21 days
 *             (a break loses strength: May → Sep, chest press 73 → 63 kg)
 *   trend     least squares of the best e1RM on the day; with ≥ 8 points the
 *             hard sets done before for the same muscles enter as a second
 *             regressor (Nunes 2021: strength is higher early in a session),
 *             and the level is read at the exercise's usual place
 *   noise     the typical error TE = residuals' SD ÷ mean (≥ 5 points; else
 *             7 %, the developer's prior), Hopkins 2000
 *   words     "stabile" when the change over the window is under 2 × TE/√n;
 *             else rising or falling, with the slope as % a month
 */
import { daysBetween, type IsoDate } from "../time/date";
import { median, ols } from "./stats";

export const GAP_DAYS = 21;
export const WINDOW_DAYS = 42;
const MIN_POINTS = 3;
const TE_MIN_POINTS = 5;
/** The typical error before an exercise has its own (fraction of the level). */
export const TE_PRIOR = 0.07;
const ORDER_MIN_POINTS = 8;

export type TrendPoint = {
  day: IsoDate;
  /** Best e1RM (or reps, or seconds, for moves without a load) that day. */
  value: number;
  /** Hard sets done before it in the session for the same muscles. */
  before?: number | undefined;
};

export type Trend =
  | { state: "few"; n: number; since: IsoDate | null }
  | {
      state: "stable" | "rising" | "falling";
      n: number;
      since: IsoDate;
      /** The trend's value on the last day, at the exercise's usual place. */
      level: number;
      /** Slope as % of the level per 28 days. */
      perMonthPct: number;
      /** Typical error as a fraction of the level, and whether it is the exercise's own. */
      te: number;
      teOwn: boolean;
      /** % of the level per hard set done before for the same muscles (≥ 8 points). */
      orderPctPerSet: number | null;
    };

/** The points the trend reads: after the last gap > 21 days, within 6 weeks of the last one. */
export function trendWindow(points: readonly TrendPoint[]): TrendPoint[] {
  const sorted = [...points].sort((a, b) => a.day.localeCompare(b.day));
  let start = 0;
  for (let i = 1; i < sorted.length; i++)
    if (daysBetween(sorted[i - 1]!.day, sorted[i]!.day) > GAP_DAYS) start = i;
  const run = sorted.slice(start);
  const last = run.at(-1);
  return last ? run.filter((p) => daysBetween(p.day, last.day) <= WINDOW_DAYS) : [];
}

export function exerciseTrend(points: readonly TrendPoint[]): Trend {
  const w = trendWindow(points);
  if (w.length < MIN_POINTS)
    return { state: "few", n: w.length, since: w[0]?.day ?? null };
  const first = w[0]!.day;
  const x = (p: TrendPoint) => daysBetween(first, p.day);
  const befores = w.map((p) => p.before ?? 0);
  const withOrder = w.length >= ORDER_MIN_POINTS && new Set(befores).size > 1;
  const fit = withOrder
    ? ols(w.map((p) => ({ y: p.value, x: [x(p), p.before ?? 0] })))
    : ols(w.map((p) => ({ y: p.value, x: [x(p)] })));
  const mean = w.reduce((s, p) => s + p.value, 0) / w.length;
  if (!fit || !(mean > 0)) return { state: "few", n: w.length, since: first };
  const [a, b, c] = fit.coef as [number, number, number?];
  const usual = withOrder ? median(befores) : 0;
  const span = x(w.at(-1)!);
  const level = a + b * span + (c ?? 0) * usual;
  const teOwn = w.length >= TE_MIN_POINTS;
  const te = teOwn ? fit.sd / mean : TE_PRIOR;
  const change = (b * span) / mean;
  const state =
    Math.abs(change) < (2 * te) / Math.sqrt(w.length)
      ? "stable"
      : change > 0
        ? "rising"
        : "falling";
  return {
    state,
    n: w.length,
    since: first,
    level,
    perMonthPct: ((b * 28) / mean) * 100,
    te,
    teOwn,
    orderPctPerSet: withOrder && c !== undefined ? (c / mean) * 100 : null,
  };
}
