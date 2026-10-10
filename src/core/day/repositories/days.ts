/**
 * core/day/repositories/days.ts — gathers what resolveDay needs for any
 * range of days (ADR-0040), with range queries: the days' types, the
 * active program's items on the days from today on (ADR-0024/0035; a
 * skipped day adds nothing), what each day costs (getEnergyRange), and
 * the goal and weekly check-in in force on each day (ADR-0043).
 * One day is the range [day, day]: the same code, the same numbers.
 *
 * Tested in: days.test.ts.
 */
import type { Db } from "../../db/client";
import { getEnergyRange, type SlotsByDay } from "../../energy/repositories/energy";
import {
  checkinOn,
  goalFrom,
  listGoals,
  listWeekCheckins,
} from "../../energy/repositories/goals";
import type { Owner } from "../../identity/owner";
import { getDayTargetsRange } from "../../nutrition/repositories/profiles";
import { addDays } from "../../shared/dates";
import { getActivePlan } from "../../training/repositories/programs";
import { resolveDay, type ResolvedDay } from "../resolve";

/** How far ahead the program is laid out (programSlotOn's horizon). */
const PROGRAM_DAYS = 28;

/** The active program's items on each day of [from, to] from today on. */
async function programSlots(
  db: Db,
  owner: Owner,
  from: string,
  to: string,
  today: string,
): Promise<SlotsByDay> {
  const out = new Map<
    string,
    { items: readonly { routineId: string | null; exerciseId: string | null }[] }
  >();
  if (to < today) return out;
  const active = await getActivePlan(db, owner, today, PROGRAM_DAYS);
  for (const p of active?.plan ?? []) {
    if (p.day < from || p.day > to || p.skipped) continue;
    out.set(p.day, { items: p.slot.items });
  }
  return out;
}

export async function readDays(
  db: Db,
  owner: Owner,
  from: string,
  to: string,
  options: { today: string; autoTargets: boolean },
): Promise<Map<string, ResolvedDay>> {
  const [plans, slots, goals, checkins] = await Promise.all([
    getDayTargetsRange(db, owner, from, to),
    programSlots(db, owner, from, to, options.today),
    listGoals(db, owner),
    listWeekCheckins(db, owner),
  ]);
  const energy = await getEnergyRange(db, owner, from, to, slots);
  const out = new Map<string, ResolvedDay>();
  for (let day = from; day <= to; day = addDays(day, 1))
    out.set(
      day,
      resolveDay(day, plans.get(day)!, energy.get(day)!, options, {
        goal: goalFrom(goals, day),
        checkin: checkinOn(checkins, day),
      }),
    );
  return out;
}

/** One day, resolved (readDays over [day, day]). */
export async function readDay(
  db: Db,
  owner: Owner,
  day: string,
  options: { today: string; autoTargets: boolean },
): Promise<ResolvedDay> {
  return (await readDays(db, owner, day, day, options)).get(day)!;
}
