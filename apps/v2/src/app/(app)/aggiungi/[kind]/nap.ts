/**
 * One «Sonno» sheet for the night and the nap (capture.md §9.2): a sleep
 * under 3 hours that starts and ends in the day (08:00–21:00 local) is
 * saved as a nap, never the night's sleep; the night is never a nap.
 */
import type { CheckedEntry } from "@/core/entries";
import { localParts } from "@/core/engines/time";

const NAP_MAX_MIN = 180;
const DAY_FROM = 8 * 60;
const DAY_TO = 21 * 60;

export function asNap(e: CheckedEntry, timeZone: string): CheckedEntry {
  if (e.kind !== "sleep" || !e.startAt || !e.endAt) return e;
  const min = (e.endAt.getTime() - e.startAt.getTime()) / 60_000;
  const from = localParts(e.startAt, timeZone).minute;
  const to = localParts(e.endAt, timeZone).minute;
  if (min <= 0 || min >= NAP_MAX_MIN || from < DAY_FROM || to > DAY_TO || to < from)
    return e;
  // A nap has no quality nor v1's typed bed and wake.
  return { ...e, kind: "nap", values: [] };
}
