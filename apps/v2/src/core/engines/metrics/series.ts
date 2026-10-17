/**
 * E2 Metrics — series (engines.md E2, concepts §6): the session window, and
 * the transforms over a series of points:
 *   trend   an exponential moving average with a half-life in days, robust
 *           to gaps (a point after a week pulls more than one after a day),
 *           with σ from the residuals' moving variance
 *   rate    per week: the least-squares slope of the known points × 7
 * The body's trend weight is E4's filter, not this: this trend is for any
 * other metric (e1RM best per session, sleep, steps…).
 */
import type { IsoDate } from "../time/date";
import { daysBetween } from "../time/date";
import type { Window } from "../time/window";
import { contains } from "../time/window";
import type { MetricDefinition, MetricEntry, MetricPoint } from "./metric";
import { bucketValue } from "./metric";

/** A known value on a day. */
export type SeriesPoint = { day: IsoDate; value: number };

/**
 * One point per session in the window: the metric over the entries whose `parent` is that
 * session ("e1RM best per session"). Sessions are taken in the order of their first entry.
 */
export function perSession(
  entries: readonly MetricEntry[],
  def: Pick<MetricDefinition, "source" | "filter" | "aggregate">,
  w: Window,
): (MetricPoint & { session: string })[] {
  const order: string[] = [];
  const day = new Map<string, IsoDate>();
  for (const e of [...entries].sort((a, b) =>
    a.day < b.day ? -1 : a.day > b.day ? 1 : 0,
  )) {
    if (e.parent === undefined || !contains(w, e.day) || day.has(e.parent)) continue;
    order.push(e.parent);
    day.set(e.parent, e.day);
  }
  return order.map((s) => {
    const d = day.get(s)!;
    const mine = entries.filter((e) => e.parent === s);
    return {
      session: s,
      window: { from: d, to: d },
      value: bucketValue(mine, def, { from: d, to: d }),
    };
  });
}

/** The known points of a metric's series, each on its bucket's last day. */
export function toSeries(points: readonly MetricPoint[]): SeriesPoint[] {
  return points.flatMap((p) =>
    p.value.known ? [{ day: p.window.to, value: Number(p.value.value) }] : [],
  );
}

export type TrendPoint = SeriesPoint & { trend: number; sigma: number };

/** EMA with a half-life in days; σ is the moving SD of the residuals (0 on the first point). */
export function trend(
  series: readonly SeriesPoint[],
  halfLifeDays: number,
): TrendPoint[] {
  if (!(halfLifeDays > 0))
    throw new RangeError(`half-life must be positive, got ${halfLifeDays}`);
  const out: TrendPoint[] = [];
  let t: number | null = null;
  let v = 0;
  let last: IsoDate | null = null;
  for (const p of [...series].sort((a, b) => (a.day < b.day ? -1 : 1))) {
    if (t === null || last === null) {
      t = p.value;
    } else {
      const days = Math.max(1, daysBetween(last, p.day));
      const a = 1 - 2 ** (-days / halfLifeDays);
      const r = p.value - t;
      t += a * r;
      v = (1 - a) * (v + a * r * r);
    }
    last = p.day;
    out.push({ ...p, trend: t, sigma: Math.sqrt(v) });
  }
  return out;
}

/** Change per week: the least-squares slope over the days × 7; null under two days. */
export function ratePerWeek(series: readonly SeriesPoint[]): number | null {
  if (series.length < 2) return null;
  const first = series.reduce((a, p) => (p.day < a ? p.day : a), series[0]!.day);
  const xs = series.map((p) => daysBetween(first, p.day));
  const mx = xs.reduce((a, x) => a + x, 0) / xs.length;
  const my = series.reduce((a, p) => a + p.value, 0) / series.length;
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  if (sxx === 0) return null;
  const sxy = xs.reduce((a, x, i) => a + (x - mx) * (series[i]!.value - my), 0);
  return (sxy / sxx) * 7;
}
