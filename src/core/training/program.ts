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
 */
import { addDays } from "../shared/dates";

/** A routine, or one exercise (a run), or neither: a rest day. */
export type Slot = {
  position: number;
  routineId: string | null;
  exerciseId?: string | null;
  label: string;
};
export type DoneSession = {
  day: string;
  routineId: string | null;
  /** Its exercises: a session with an exercise counts for that exercise's slot. */
  exerciseIds?: readonly string[];
};

export const isRest = (s: Slot) => !s.routineId && !s.exerciseId;
const matches = (slot: Slot, s: DoneSession) =>
  slot.routineId
    ? s.routineId === slot.routineId
    : slot.exerciseId
      ? (s.exerciseIds ?? []).includes(slot.exerciseId)
      : false;
export type PlanDay = {
  day: string;
  /** The slot due; rest when routineId is null. */
  slot: Slot;
  /** The cycle slipped: this slot was due earlier and was not done. */
  late: boolean;
};

export function programPlan(input: {
  slots: readonly Slot[];
  startDay: string;
  today: string;
  /** Done sessions from startDay on (any order). */
  done: readonly DoneSession[];
  /** How many days to plan from today. */
  days: number;
}): { plan: PlanDay[]; doneToday: boolean } {
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

  for (let d = input.startDay; d < input.today; d = addDays(d, 1))
    apply(d, byDay.get(d) ?? []);
  const todaySessions = byDay.get(input.today) ?? [];
  const doneToday = todaySessions.length > 0;
  if (doneToday) apply(input.today, todaySessions);

  const plan: PlanDay[] = [];
  let d = doneToday ? addDays(input.today, 1) : input.today;
  if (input.today < input.startDay) d = input.startDay;
  const last = addDays(input.today, input.days - 1);
  for (; d <= last; d = addDays(d, 1)) {
    const slot = slots[p % n]!;
    plan.push({
      day: d,
      slot,
      late: plan.length === 0 && !isRest(slot) && since < d,
    });
    p++;
    while (ahead.has(p)) ahead.delete(p++);
  }
  return { plan, doneToday };
}
