/**
 * core/energy/repositories/goals.ts — the goal and the weekly check-ins
 * (ADR-0043). Owner-filtered; both are histories read newest first, and
 * the row in force on a day is found by the pure helpers below, so a range
 * of days needs one query each.
 */
import { desc, eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  goals,
  weekCheckins,
  type DietSplit,
  type GoalKind,
  type KcalFloor,
  type ProteinPreference,
} from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { addDays } from "../../shared/dates";
import { fail, ok, type Result } from "../../shared/result";

export type WeightGoal = {
  sinceDay: string;
  /** ADR-0045: null on goals set before it (their stored rate applies). */
  kind: GoalKind | null;
  /** By when the target weight should be reached; optional. */
  targetDay: string | null;
  /** % of body weight a week, signed (−0.5 = lose 0.5 % a week). */
  ratePctWeek: string;
  targetKg: string | null;
  kcalFloor: KcalFloor;
  protein: ProteinPreference;
  split: DietSplit;
  /** 0 = Sunday … 6 = Saturday. */
  checkInWeekday: number;
};

export type WeightGoalInput = Omit<WeightGoal, "sinceDay">;

/** Goals, newest first. */
export function listGoals(db: Db, owner: Owner): Promise<WeightGoal[]> {
  return db
    .select({
      sinceDay: goals.sinceDay,
      kind: goals.kind,
      targetDay: goals.targetDay,
      ratePctWeek: goals.ratePctWeek,
      targetKg: goals.targetKg,
      kcalFloor: goals.kcalFloor,
      protein: goals.protein,
      split: goals.split,
      checkInWeekday: goals.checkInWeekday,
    })
    .from(goals)
    .where(ownedBy(goals, owner))
    .orderBy(desc(goals.sinceDay));
}

/** The goal in force on `day` (the latest since_day ≤ day), over rows newest first. */
export function goalFrom(rows: readonly WeightGoal[], day: string): WeightGoal | null {
  return rows.find((g) => g.sinceDay <= day) ?? null;
}

/**
 * Sets the goal from `day` on (today, in practice): past days keep the goal
 * they had. Setting it twice on one day replaces that day's row.
 */
export async function setGoal(
  db: Db,
  owner: Owner,
  day: string,
  input: WeightGoalInput,
): Promise<void> {
  await db
    .insert(goals)
    .values({ userId: owner.id, sinceDay: day, ...input })
    .onConflictDoUpdate({ target: [goals.userId, goals.sinceDay], set: input });
}

export type WeekCheckin =
  | {
      startDay: string;
      decision: "accepted";
      expenditureKcal: number | null;
      factor: string | null;
      trendKg: string | null;
      kcal: number;
      protein: number;
      fat: number;
      carbs: number;
      fiber: number;
    }
  | { startDay: string; decision: "skipped" };

export type AcceptedCheckin = Extract<WeekCheckin, { decision: "accepted" }>;

/** Check-ins, newest first. */
export async function listWeekCheckins(db: Db, owner: Owner): Promise<WeekCheckin[]> {
  const rows = await db
    .select()
    .from(weekCheckins)
    .where(ownedBy(weekCheckins, owner))
    .orderBy(desc(weekCheckins.startDay));
  return rows.map((r) =>
    r.decision === "accepted"
      ? {
          startDay: r.startDay,
          decision: "accepted",
          expenditureKcal: r.expenditureKcal,
          factor: r.factor,
          trendKg: r.trendKg,
          // The check constraint guarantees them on accepted rows.
          kcal: r.kcal!,
          protein: r.protein!,
          fat: r.fat!,
          carbs: r.carbs!,
          fiber: r.fiber!,
        }
      : { startDay: r.startDay, decision: "skipped" },
  );
}

/**
 * The check-in in force on `day`: the latest with start_day ≤ day, if it
 * was accepted and the day is within its 7 days; else null (the day is
 * computed live). Over rows newest first.
 */
export function checkinOn(
  rows: readonly WeekCheckin[],
  day: string,
): AcceptedCheckin | null {
  const c = rows.find((r) => r.startDay <= day);
  if (!c || c.decision !== "accepted") return null;
  return day <= addDays(c.startDay, 6) ? c : null;
}

/**
 * Records a check-in. An accepted one is never changed: a second check-in
 * on the same day fails with not_editable; a skipped one may be replaced.
 */
export async function recordWeekCheckin(
  db: Db,
  owner: Owner,
  checkin: WeekCheckin,
): Promise<Result<null>> {
  const numbers =
    checkin.decision === "accepted"
      ? (({ startDay: _day, decision: _decision, ...n }) => n)(checkin)
      : {
          expenditureKcal: null,
          factor: null,
          trendKg: null,
          kcal: null,
          protein: null,
          fat: null,
          carbs: null,
          fiber: null,
        };
  const set = { decision: checkin.decision, ...numbers };
  const written = await db
    .insert(weekCheckins)
    .values({ userId: owner.id, startDay: checkin.startDay, ...set })
    .onConflictDoUpdate({
      target: [weekCheckins.userId, weekCheckins.startDay],
      set,
      setWhere: eq(weekCheckins.decision, "skipped"),
    })
    .returning({ startDay: weekCheckins.startDay });
  return written.length ? ok(null) : fail({ _form: "not_editable" });
}
