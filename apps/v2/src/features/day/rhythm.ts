/**
 * features/day/rhythm.ts — each day of the week as its 24 hours (ledger UI-76,
 * level 2 of the week strip): the sleep (the day's night and naps, and the
 * evening part of the night that ends the next morning), the meals done at
 * their time in their role's colour, the sessions done. Minutes of the clock
 * day, 0–1440. Pure.
 */
import type { Rhythm } from "@lifeos/kit";
import { dayMinute, type Day, type DayItem } from "@/core/day";
import { addDays, type DayClock } from "@/core/engines/time";
import { sleepOfDay, type ScoreContext } from "./score";

const ROLE: Record<string, string> = {
  breakfast: "var(--moment-breakfast)",
  lunch: "var(--moment-lunch)",
  dinner: "var(--moment-dinner)",
  snack: "var(--moment-snack)",
};

export function weekRhythm(
  days: readonly Day[],
  ctxOf: (date: string) => ScoreContext,
  clock: DayClock,
): Record<string, Rhythm> {
  const out: Record<string, Rhythm> = {};
  for (const d of days) {
    const items = [...d.timed, ...d.untimed];
    const done = (i: DayItem) => i.status === "done";
    const min = (at: Date) => Math.max(0, Math.min(1440, dayMinute(at, d.day, clock)));
    const sd = sleepOfDay(items, ctxOf(d.day));
    // The next night comes from the context's sleep pieces, not from this day's entries.
    const next = sleepOfDay([], ctxOf(addDays(d.day, 1))).night;
    out[d.day] = {
      bands: [sd.night, ...sd.naps, next]
        .flatMap((p) => (p ? [{ from: min(p.bed), to: min(p.wake) }] : []))
        .filter((b) => b.to > b.from),
      meals: items
        .filter((i) => i.kind.key === "meal" && done(i) && i.minute !== null)
        .map((i) => ({
          at: Math.min(1440, i.minute!),
          c: ROLE[String(i.values["role"] ?? i.subcategory ?? "")] ?? "var(--kcal)",
        })),
      sessions: items
        .filter((i) => i.kind.key === "session" && done(i) && i.start && i.end)
        .map((i) => ({ from: min(i.start!), to: min(i.end!) })),
    };
  }
  return out;
}
