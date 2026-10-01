/**
 * core/training/program.ts — what an ordered training cycle (ADR-0024)
 * says about each day, DERIVED from its slots and the sessions done; never
 * stored. Pure; tested in program.test.ts.
 *
 * Walking the days from the program's start:
 *   - a day with no session done: a rest slot due is consumed (rested as
 *     planned); a routine slot due stays due — the cycle slips, nothing lost;
 *   - a session done of the routine due: that slot is done, the cycle moves on;
 *   - a session of another routine of this round: that slot is marked done
 *     ahead (skipped when reached); a rest due that day is consumed first;
 *   - a session of a routine not in the program: extra, the cycle ignores it.
 * From today on, the slots still to do are laid on the coming days, one per
 * day; today counts only if nothing was done yet.
 */
import { addDays } from "../shared/dates";

export type Slot = { position: number; routineId: string | null; label: string };
export type DoneSession = { day: string; routineId: string | null };
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
    if (sessions.length === 0) {
      if (slots[p % n]!.routineId === null) advance(addDays(d, 1));
      return;
    }
    if (slots[p % n]!.routineId === null && !sessions.some((s) => s.routineId === null))
      advance(d); // trained on a rest day: the rest is taken as done
    for (const s of sessions) {
      if (s.routineId === null) continue;
      if (slots[p % n]!.routineId === s.routineId) {
        advance(addDays(d, 1));
        continue;
      }
      // Another routine of this round: done ahead.
      for (let q = p + 1; q < p + n; q++)
        if (slots[q % n]!.routineId === s.routineId && !ahead.has(q)) {
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
      late: plan.length === 0 && slot.routineId !== null && since < d,
    });
    p++;
    while (ahead.has(p)) ahead.delete(p++);
  }
  return { plan, doneToday };
}
