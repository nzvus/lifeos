/**
 * core/shared/dates.ts — calendar days, without time-zone bugs.
 *
 * A log entry belongs to a DAY ('2026-09-29'), not to an instant. The server
 * runs in UTC (Vercel), but "today" for you is Italian time: at 00:30 in Rome
 * it is still yesterday in UTC. So "today" is always computed in the user's
 * time zone (user_settings.timezone), and days are handled as plain strings.
 *
 * Pure module; tested in dates.test.ts.
 */

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar day in 'YYYY-MM-DD' form (rejects 2026-02-30). */
export function isValidDay(s: string): boolean {
  if (!DAY_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  // Date silently rolls 2026-02-30 over to March 2; comparing back catches it.
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Today's date in the given IANA time zone, e.g. "Europe/Rome". */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  // The en-CA locale happens to format dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Moves a day by n days (negative = back). Works in UTC: no DST surprises. */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** True if the runtime knows this IANA time zone name. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
