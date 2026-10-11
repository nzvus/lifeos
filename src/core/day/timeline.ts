/**
 * core/day/timeline.ts — the day as one timeline (ADR-0050). Pure.
 *
 * In: the day's items as core/nutrition/slots withSlots gives them (moment
 * groups, matched to their slot or not, and empty slots), the day's
 * training sessions, and — on today — the time now. Out: one list in time
 * order, each row with its minute of the day:
 *
 *   group    food of one moment, at its slot's time or its own
 *   empty    a slot with no food yet; `past` once its time has gone
 *   session  a training session, at its real start or its planned time
 *   now      the "now" line (today only)
 *
 * Food with no time and no slot ("not set") goes last, as before.
 */
import type { Moment, MomentBounds } from "../nutrition/moments";
import type { ProgramSlot } from "../nutrition/programs";
import { groupAt, type DayItem } from "../nutrition/slots";

/** A session without any time sits here (late afternoon, the usual gym hour). */
export const SESSION_DEFAULT_AT = 17 * 60 + 30;

export type TimelineSession = {
  id: string;
  label: string;
  status: "planned" | "done";
  /** Minutes after midnight: the real start, else the program's time, else null. */
  at: number | null;
};

export type TimelineRow<E> =
  | { type: "group"; at: number | null; item: Extract<DayItem<E>, { type: "group" }> }
  | {
      type: "empty";
      at: number;
      past: boolean;
      item: Extract<DayItem<E>, { type: "empty" }>;
    }
  | { type: "session"; at: number; session: TimelineSession }
  | { type: "now"; at: number };

/**
 * Slots for a day whose type has no program (ADR-0050): the main meals at
 * the times the moments usually have, without shares — so the day still
 * reads as a timeline with places to fill.
 */
export function defaultSlots(bounds: MomentBounds): ProgramSlot[] {
  const at = (m: Moment, minutes: number) => ({
    kind: m,
    at: minutes,
    kcalShare: null,
    proteinShare: null,
  });
  return [
    at("breakfast", Math.min(8 * 60, bounds.lunch - 60)),
    at("lunch", Math.max(bounds.lunch + 60, 13 * 60)),
    at("dinner", Math.max(bounds.dinner + 60, 20 * 60)),
  ];
}

export function timeline<E>(
  items: readonly DayItem<E>[],
  sessions: readonly TimelineSession[],
  /** Minutes after midnight on today; null on other days. */
  now: number | null,
  /** The day is over (a past day): every empty slot is past. */
  over: boolean,
): TimelineRow<E>[] {
  const rows: TimelineRow<E>[] = [];
  for (const item of items) {
    if (item.type === "empty") {
      rows.push({
        type: "empty",
        at: item.slot.at,
        past: over || (now !== null && item.slot.at < now),
        item,
      });
    } else {
      rows.push({ type: "group", at: groupAt(item), item });
    }
  }
  for (const s of sessions)
    rows.push({ type: "session", at: s.at ?? SESSION_DEFAULT_AT, session: s });
  if (now !== null) rows.push({ type: "now", at: now });
  // Time order; "now" after anything at the same minute; no time last.
  const rank = (r: TimelineRow<E>) => (r.type === "now" ? 1 : 0);
  return rows
    .map((r, i) => ({ r, i }))
    .sort(
      (a, b) =>
        (a.r.at ?? Infinity) - (b.r.at ?? Infinity) || rank(a.r) - rank(b.r) || a.i - b.i,
    )
    .map((x) => x.r);
}
