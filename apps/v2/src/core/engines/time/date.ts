/**
 * Calendar dates as `YYYY-MM-DD` strings (v1's convention: a date has no
 * time and no zone). Arithmetic goes through UTC midnight, so a daylight
 * saving change can never shift a date.
 */

export type IsoDate = string;

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a date, rejecting impossible ones (2026-02-30). */
export function parseDate(d: IsoDate): Date {
  const m = ISO.exec(d);
  if (!m) throw new RangeError(`not a YYYY-MM-DD date: ${d}`);
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (t.getUTCMonth() !== Number(m[2]) - 1) throw new RangeError(`no such date: ${d}`);
  return t;
}

export function formatDate(t: Date): IsoDate {
  return t.toISOString().slice(0, 10);
}

export function addDays(d: IsoDate, n: number): IsoDate {
  const t = parseDate(d);
  t.setUTCDate(t.getUTCDate() + n);
  return formatDate(t);
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 864e5);
}

/** ISO weekday: Monday 1 … Sunday 7. */
export function isoWeekday(d: IsoDate): number {
  return ((parseDate(d).getUTCDay() + 6) % 7) + 1;
}
