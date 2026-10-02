/**
 * core/training/sleep.ts — a night's sleep (ADR-0031). Pure; tested in
 * sleep.test.ts.
 *
 *   score   100 for 7–9 h (AASM / NSF adult range), 50 at 6 h or 10 h,
 *           0 at 4 h or 12 h, straight lines between
 *   short   under 6 h: a clue for the next weigh-in (ADR-0027)
 */
import { addDays, instantFor } from "../shared/dates";

export const SHORT_NIGHT_H = 6;

/** Hours between bedtime and waking, to a tenth. */
export function sleepHours(bedAt: Date, wakeAt: Date): number {
  return Math.round(((wakeAt.getTime() - bedAt.getTime()) / 3_600_000) * 10) / 10;
}

export function sleepScore(hours: number): number {
  const lerp = (x: number, x0: number, x1: number, y0: number, y1: number) =>
    y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  let s: number;
  if (hours >= 7 && hours <= 9) s = 100;
  else if (hours < 7)
    s = hours >= 6 ? lerp(hours, 6, 7, 50, 100) : lerp(hours, 4, 6, 0, 50);
  else s = hours <= 10 ? lerp(hours, 9, 10, 100, 50) : lerp(hours, 10, 12, 50, 0);
  return Math.round(Math.max(0, Math.min(100, s)));
}

/**
 * The night that ended on `day`: a bedtime later than the wake time (23:40
 * → 07:00) was the evening before; earlier (01:30 → 08:00), the same day.
 */
export function nightInstants(
  day: string,
  bed: string,
  wake: string,
  timeZone: string,
): { bedAt: Date; wakeAt: Date } {
  const bedDay = bed > wake ? addDays(day, -1) : day;
  return {
    bedAt: instantFor(bedDay, bed, timeZone),
    wakeAt: instantFor(day, wake, timeZone),
  };
}
