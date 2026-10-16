/**
 * E1 Time — recurrence (engines.md E1, concepts §5): daily, on chosen
 * weekdays, every N days, N times a week (flexible days), on dates.
 * "N times a week" plans nothing on fixed days; it counts done days in the
 * ISO week.
 */
import type { IsoDate } from "./date";
import { daysBetween, isoWeekday } from "./date";
import type { Window } from "./window";
import { daysOf, isoWeek } from "./window";

export type Recurrence =
  | { type: "daily" }
  /** ISO weekdays, Monday 1 … Sunday 7; "on weekdays" is [1, 2, 3, 4, 5]. */
  | { type: "weekdays"; days: number[] }
  | { type: "everyN"; n: number; start: IsoDate }
  | { type: "timesPerWeek"; n: number }
  | { type: "onDates"; dates: IsoDate[] };

export const WEEKDAYS: Recurrence = { type: "weekdays", days: [1, 2, 3, 4, 5] };

/** Whether the rule plans an occurrence on this day. A flexible rule plans none. */
export function plannedOn(rule: Recurrence, d: IsoDate): boolean {
  switch (rule.type) {
    case "daily":
      return true;
    case "weekdays":
      return rule.days.includes(isoWeekday(d));
    case "everyN": {
      if (!Number.isInteger(rule.n) || rule.n < 1)
        throw new RangeError(`every N days needs N ≥ 1, got ${rule.n}`);
      const k = daysBetween(rule.start, d);
      return k >= 0 && k % rule.n === 0;
    }
    case "timesPerWeek":
      return false;
    case "onDates":
      return rule.dates.includes(d);
  }
}

export type Progress = { done: number; due: number; met: boolean };

/**
 * How a window went against the rule. Fixed rules: the planned days done, out of the planned days.
 * N times a week: done days in the window's ISO week (any day counts), out of N; the window must be one ISO week.
 */
export function progress(
  rule: Recurrence,
  doneDays: ReadonlySet<IsoDate>,
  w: Window,
): Progress {
  if (rule.type === "timesPerWeek") {
    const week = isoWeek(w.from);
    if (week.from !== w.from || week.to !== w.to)
      throw new RangeError("N times a week is measured on an ISO week");
    const done = daysOf(w).filter((d) => doneDays.has(d)).length;
    return { done, due: rule.n, met: done >= rule.n };
  }
  const planned = daysOf(w).filter((d) => plannedOn(rule, d));
  const done = planned.filter((d) => doneDays.has(d)).length;
  return { done, due: planned.length, met: done >= planned.length };
}
