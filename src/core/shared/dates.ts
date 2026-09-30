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
/** The Monday of the week containing `day` (weeks start on Monday, ISO 8601). */
export function startOfWeek(day: string): string {
  // getUTCDay: 0 = Sunday … 6 = Saturday; noon UTC so no zone can shift it.
  const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
}

/** The `n` days ending on `last`, oldest first: ["…", …, last]. */
export function daysEnding(last: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(last, i - (n - 1)));
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** True for a clock time "HH:MM" (00:00–23:59). */
export function isValidTime(s: string): boolean {
  return TIME_RE.test(s);
}

/** Offset of `timeZone` from UTC at `instant`, in minutes (Rome summer: +120). */
function offsetMinutes(timeZone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/**
 * The instant at which the clock shows `time` on `day` in `timeZone`
 * ("2026-09-29", "12:30", "Europe/Rome" -> 10:30 UTC). Done without a
 * library: take the wall time as if it were UTC, subtract the zone's offset,
 * then correct once more because the offset itself can differ on the other
 * side of a daylight-saving change.
 */
export function instantFor(day: string, time: string, timeZone: string): Date {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  const [h, min] = time.split(":").map(Number) as [number, number];
  const wall = Date.UTC(y, m - 1, d, h, min);
  let guess = new Date(wall - offsetMinutes(timeZone, new Date(wall)) * 60000);
  guess = new Date(wall - offsetMinutes(timeZone, guess) * 60000);
  return guess;
}

/** The wall-clock time "HH:MM" of `instant` in `timeZone`. */
export function timeIn(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}
