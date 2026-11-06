/**
 * E1 Time — windows (engines.md E1): day, ISO week (Monday), month,
 * rolling N days, a custom range. A window over days with no entries is
 * *unknown*, never zero: v1's "an unlogged day is not a fast".
 */
import type { IsoDate } from "./date";
import { addDays, daysBetween, isoWeekday, parseDate } from "./date";

/** Inclusive range of logical days. */
export type Window = { from: IsoDate; to: IsoDate };

export function dayWindow(d: IsoDate): Window {
  parseDate(d);
  return { from: d, to: d };
}

/** The ISO week (Monday to Sunday) that holds `d`. */
export function isoWeek(d: IsoDate): Window {
  const from = addDays(d, 1 - isoWeekday(d));
  return { from, to: addDays(from, 6) };
}

export function month(d: IsoDate): Window {
  const t = parseDate(d);
  const from = `${d.slice(0, 7)}-01`;
  const last = new Date(
    Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return { from, to: `${d.slice(0, 7)}-${String(last).padStart(2, "0")}` };
}

/** The `n` days that end on `end`, `end` included. */
export function rolling(n: number, end: IsoDate): Window {
  if (!Number.isInteger(n) || n < 1)
    throw new RangeError(`a rolling window needs n ≥ 1, got ${n}`);
  return { from: addDays(end, -(n - 1)), to: end };
}

export function custom(from: IsoDate, to: IsoDate): Window {
  if (daysBetween(from, to) < 0)
    throw new RangeError(`window ends before it starts: ${from} → ${to}`);
  return { from, to };
}

export function daysOf(w: Window): IsoDate[] {
  const n = daysBetween(w.from, w.to);
  return Array.from({ length: n + 1 }, (_, i) => addDays(w.from, i));
}

export function contains(w: Window, d: IsoDate): boolean {
  return d >= w.from && d <= w.to;
}

/** A value over a window: known on some days, or unknown on all of them. */
export type Over<T> =
  { known: false } | { known: true; value: T; days: number; of: number };

/**
 * Folds the per-day values that exist inside the window. Days without a value are
 * not zeros: they are left out and counted, and a window with none is unknown.
 */
export function over<T, R>(
  w: Window,
  byDay: ReadonlyMap<IsoDate, T>,
  fold: (values: T[]) => R,
): Over<R> {
  const all = daysOf(w);
  const values = all.flatMap((d) => (byDay.has(d) ? [byDay.get(d) as T] : []));
  if (values.length === 0) return { known: false };
  return { known: true, value: fold(values), days: values.length, of: all.length };
}
