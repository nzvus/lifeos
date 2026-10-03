/**
 * core/training/program.ts — what an ordered training cycle (ADR-0024)
 * says about each day, DERIVED from its slots and the sessions done; never
 * stored. Pure; tested in program.test.ts.
 *
 * A slot is a routine, one exercise (a session containing it counts), or
 * a rest day. Walking the days from the program's start:
 *   - a day with no session that counts: a rest slot due is consumed (rested
 *     as planned); a training slot due stays due — the cycle slips;
 *   - a session for the slot due: that slot is done, the cycle moves on;
 *   - a session for another slot of this round: that slot is marked done
 *     ahead (skipped when reached); a rest due that day is consumed first;
 *   - a session that fits no slot: extra, the cycle ignores it.
 * From today on, the slots still to do are laid on the coming days, one per
 * day; today counts only if nothing was done yet.
 *
 * ADR-0035: a slot is a LIST of items (routines and/or exercises); empty is
 * rest. A session counts for a slot when it matches any of its items.
 * A skipped day (program_skips) passes the training slot due without doing
 * it: the cycle moves on, nothing is late.
 *
 * ADR-0029: overrides change single coming days — "this slot" or rest.
 * They take their days first; the cycle fills the other days in order,
 * skipping a slot an override has placed later in the same round, so it is
 * not done twice. A rest override pauses the cycle (a rest due is taken).
 */
import { addDays } from "../shared/dates";

/** One thing to do on a program day: a routine, or one exercise (a run). */
export type SlotItem = { routineId: string | null; exerciseId: string | null };
/** A program day: its items in order; none is a rest day (named by `label`). */
export type Slot = {
  position: number;
  items: readonly SlotItem[];
  label: string;
};
export type DoneSession = {
  day: string;
  routineId: string | null;
  /** Its exercises: a session with an exercise counts for that exercise's slot. */
  exerciseIds?: readonly string[];
};

export const isRest = (s: Slot) => s.items.length === 0;
/** Does a session count for this item? */
export const itemMatches = (it: SlotItem, s: DoneSession) =>
  it.routineId
    ? s.routineId === it.routineId
    : it.exerciseId
      ? (s.exerciseIds ?? []).includes(it.exerciseId)
      : false;
const matches = (slot: Slot, s: DoneSession) =>
  slot.items.some((it) => itemMatches(it, s));
export type PlanDay = {
  day: string;
  /** The slot due; rest when routineId is null. */
  slot: Slot;
  /** The cycle slipped: this slot was due earlier and was not done. */
  late: boolean;
  /** ADR-0035: skipped on purpose — shown, not to do. */
  skipped?: boolean;
};

export function programPlan(input: {
  slots: readonly Slot[];
  startDay: string;
  today: string;
  /** Done sessions from startDay on (any order). */
  done: readonly DoneSession[];
  /** How many days to plan from today. */
  days: number;
  /** ADR-0029: coming days changed by hand (null = rest). */
  overrides?: readonly { day: string; position: number | null }[];
  /** ADR-0035: days skipped on purpose. */
  skips?: readonly string[];
}): { plan: PlanDay[]; doneToday: boolean } {
  const skips = new Set(input.skips ?? []);
  const slots = [...input.slots].sort((a, b) => a.position - b.position);
  const n = slots.length;
  if (n === 0) return { plan: [], doneToday: false };
  let p = 0; // the slot due, as a count from the start (p % n)
  let since = input.startDay; // the day the due slot became due
  const ahead = new Set<number>(); // counts done ahead of p in this round
  const byDay = new Map<string, DoneSession[]>();
  for (const s of input.done)
    if (s.day >= input.startDay) byDay.set(s.day, [...(byDay.get(s.day) ?? []), s]);

  const advance = (d: string) => {
    p++;
    while (ahead.has(p)) ahead.delete(p++);
    since = d;
  };
  const apply = (d: string, sessions: readonly DoneSession[]) => {
    const counted = sessions.filter((x) => slots.some((sl) => matches(sl, x)));
    if (counted.length === 0) {
      if (isRest(slots[p % n]!)) advance(addDays(d, 1));
      return;
    }
    if (isRest(slots[p % n]!)) advance(d); // trained on a rest day: the rest is taken as done
    for (const x of counted) {
      if (matches(slots[p % n]!, x)) {
        advance(addDays(d, 1));
        continue;
      }
      // Another slot of this round: done ahead.
      for (let q = p + 1; q < p + n; q++)
        if (matches(slots[q % n]!, x) && !ahead.has(q)) {
          ahead.add(q);
          break;
        }
    }
  };

  for (let d = input.startDay; d < input.today; d = addDays(d, 1)) {
    const sessions = byDay.get(d) ?? [];
    // A skipped day passes its training slot; it does not also take a rest.
    if (skips.has(d) && !isRest(slots[p % n]!)) {
      advance(addDays(d, 1));
      if (sessions.length) apply(d, sessions);
      continue;
    }
    apply(d, sessions);
  }
  const todaySessions = byDay.get(input.today) ?? [];
  const doneToday = todaySessions.length > 0;
  if (doneToday) apply(input.today, todaySessions);

  const plan: PlanDay[] = [];
  let d = doneToday ? addDays(input.today, 1) : input.today;
  if (input.today < input.startDay) d = input.startDay;
  const last = addDays(input.today, input.days - 1);
  const next = () => {
    p++;
    while (ahead.has(p)) ahead.delete(p++);
  };
  const byPos = new Map(slots.map((s) => [s.position, s]));
  // Coming overrides of an existing slot, in day order; `taken` once the
  // cycle has passed over their slot (so the override day doesn't take it again).
  const placed = (input.overrides ?? [])
    .filter((o) => o.day >= d && o.day <= last)
    .filter((o) => o.position === null || byPos.has(o.position))
    .sort((a, b) => (a.day < b.day ? -1 : 1))
    .map((o) => ({ ...o, taken: false }));
  const overrideOn = new Map(placed.map((o) => [o.day, o]));
  const REST: Slot = { position: -1, items: [], label: "" };

  for (; d <= last; d = addDays(d, 1)) {
    if (skips.has(d) && !isRest(slots[p % n]!)) {
      plan.push({ day: d, slot: slots[p % n]!, late: false, skipped: true });
      next();
      continue;
    }
    const o = overrideOn.get(d);
    if (o) {
      if (o.position === null) {
        if (isRest(slots[p % n]!)) next(); // a rest due is taken; else the cycle waits
        plan.push({ day: d, slot: REST, late: false });
        continue;
      }
      if (!o.taken) {
        // Consume its slot from the cycle: the one due, or the next of the round.
        if (slots[p % n]!.position === o.position) next();
        else
          for (let q = p + 1; q < p + n; q++)
            if (slots[q % n]!.position === o.position && !ahead.has(q)) {
              ahead.add(q);
              break;
            }
      }
      plan.push({ day: d, slot: byPos.get(o.position)!, late: false });
      continue;
    }
    // Skip slots an override places on a later day (at most one round).
    for (let guard = 0; guard < n; guard++) {
      const due = slots[p % n]!;
      const later = placed.find(
        (x) => !x.taken && x.day > d && x.position === due.position,
      );
      if (!later || isRest(due)) break;
      later.taken = true;
      next();
    }
    const slot = slots[p % n]!;
    plan.push({
      day: d,
      slot,
      late: plan.length === 0 && !isRest(slot) && since < d,
    });
    next();
  }
  return { plan, doneToday };
}
