/**
 * core/nutrition/timing.ts — when a new log entry happens: status and
 * instant from a form (ADR-0009). Pure. Split out of repositories/log.ts
 * (800-line limit); log.ts re-exports it.
 */
import type { EntryStatus } from "../db/schema";
import { instantFor, todayIn } from "../shared/dates";

export type EntryTiming = { status: EntryStatus; at: Date | null };

/**
 * From a form's "Planned" checkbox and optional "HH:MM" to status + instant,
 * in the user's time zone. Eaten without a time = now; planned without a
 * time = no time. Pure; used by the server actions.
 */
export function entryTiming(
  day: string,
  planned: boolean,
  time: string | null,
  timeZone: string,
  now: Date = new Date(),
): EntryTiming {
  // A day still to come can only be planned (2026-10-10: "I shouldn't be
  // able to add eaten meals on future days"), whatever the form sent.
  const future = day > todayIn(timeZone, now);
  const status: EntryStatus = planned || future ? "planned" : "eaten";
  if (time) return { status, at: instantFor(day, time, timeZone) };
  return { status, at: status === "planned" ? null : now };
}
