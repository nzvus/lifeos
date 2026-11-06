/**
 * E1 Time — the logical day of an instant (engines.md E1): the local date
 * of (instant − day boundary). With a boundary at 04:00, a snack at 01:30
 * belongs to the evening before; the person's zone decides, never the
 * server's clock (v1's invariant on "today").
 */
import type { IsoDate } from "./date";
import { addDays } from "./date";

export type DayClock = {
  /** IANA zone of the person, e.g. "Europe/Rome". */
  timeZone: string;
  /** Minutes after local midnight when the logical day starts (0 = midnight). */
  boundaryMin: number;
};

/** The local date and minute of the day of an instant, in a zone. */
export function localParts(
  instant: Date,
  timeZone: string,
): { date: IsoDate; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minute: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function logicalDay(instant: Date, clock: DayClock): IsoDate {
  if (clock.boundaryMin < 0 || clock.boundaryMin >= 24 * 60) {
    throw new RangeError(`day boundary out of range: ${clock.boundaryMin}`);
  }
  // Compare local wall-clock minutes, not instants: subtracting the boundary
  // from the instant would be wrong on the night the clocks change.
  const { date, minute } = localParts(instant, clock.timeZone);
  return minute < clock.boundaryMin ? addDays(date, -1) : date;
}

/**
 * The instant at minute `dayMin` of the logical day `day` (a `DayMin`: past
 * 1440 is the night after), in the person's zone: the inverse of reading an
 * instant's day and minute. A wall-clock time the clocks skip lands an hour
 * later; one they repeat takes its first instant.
 */
export function instantAt(day: IsoDate, dayMin: number, clock: DayClock): Date {
  const date = addDays(day, Math.floor(dayMin / 1440));
  const minute = ((dayMin % 1440) + 1440) % 1440;
  const asWall = (p: { date: IsoDate; minute: number }) => {
    const [y, m, d] = p.date.split("-").map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d, Math.floor(p.minute / 60), p.minute % 60);
  };
  const wall = asWall({ date, minute });
  // The zone's offset 12 h either side; each gives a candidate instant.
  const offset = (t: number) => asWall(localParts(new Date(t), clock.timeZone)) - t;
  const before = wall - offset(wall - 12 * 3_600_000);
  const after = wall - offset(wall + 12 * 3_600_000);
  const fits = [before, after].filter(
    (t) => asWall(localParts(new Date(t), clock.timeZone)) === wall,
  );
  return new Date(fits.length ? Math.min(...fits) : before);
}
