/**
 * core/energy/feet.ts — hours on one's feet for a day (dossiers/energy-day.md
 * §4–§5). A number, not three levels: the day's own `onFeetH` when said, else
 * an old entry's level read as hours (v1 ADR-0051's points), else the
 * person's median of the 14 days before with a value, else 3 h. Never the
 * silent «seduto» the steps form left after it stopped asking the level.
 */
import { addDays, type IsoDate } from "../engines/time";

export const LEVEL_HOURS: Readonly<Record<string, number>> = {
  sitting: 2,
  mixed: 5,
  on_feet: 8,
};
export const FEET_DEFAULT_H = 3;
export const FEET_MAX_H = 16;
const LOOKBACK_DAYS = 14;

export type FeetDay = { day: IsoDate; onFeetH?: number | null; level?: string | null };
export type Feet = { hours: number; source: "said" | "level" | "median" | "default" };

/** What a day says about itself, if anything. */
export function saidHours(d: FeetDay | undefined): Feet | null {
  if (d?.onFeetH != null && Number.isFinite(d.onFeetH))
    return { hours: Math.min(FEET_MAX_H, Math.max(0, d.onFeetH)), source: "said" };
  const h = d?.level ? LEVEL_HOURS[d.level] : undefined;
  return h === undefined ? null : { hours: h, source: "level" };
}

/** Hours on feet on `day`: its own value, else the median of the 14 days before. */
export function hoursOnFeetOn(day: IsoDate, days: readonly FeetDay[]): Feet {
  const own = saidHours(days.find((d) => d.day === day));
  if (own) return own;
  const from = addDays(day, -LOOKBACK_DAYS);
  const past = days
    .filter((d) => d.day >= from && d.day < day)
    .map((d) => saidHours(d)?.hours)
    .filter((h): h is number => h !== undefined)
    .sort((a, b) => a - b);
  if (past.length === 0) return { hours: FEET_DEFAULT_H, source: "default" };
  const m = past.length >> 1;
  const hours = past.length % 2 ? past[m]! : (past[m - 1]! + past[m]!) / 2;
  return { hours, source: "median" };
}

/** The words for a number of hours, in six bands (a reading, never an input). */
export function feetLabel(hours: number): string {
  if (hours < 2) return "quasi sempre seduto";
  if (hours < 4) return "per lo più seduto";
  if (hours < 6) return "metà e metà";
  if (hours < 8) return "molto in piedi";
  if (hours < 10) return "in piedi quasi tutto il giorno";
  return "lavoro fisico";
}
