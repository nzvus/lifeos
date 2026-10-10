/**
 * core/energy/repositories/checkin.ts — the weekly check-in (ADR-0043):
 * whether one is due, what it proposes, and accepting or skipping it.
 *
 *   due          a goal is in force and no check-in was made since the
 *                latest check-in weekday (the first one is due at once)
 *   expenditure  the last 7 days' average: learnt (ADR-0041) when its
 *                factor is known within ± 0.05, else the model with the
 *                accepted factor
 *   targets      goalTargets over it, the same for each of the 7 days,
 *                then shifted by each day's program (ADR-0044: ± kcal,
 *                the week's total kept; carbs take it)
 *
 * The numbers are computed again on accept, never taken from the form.
 * Accepting also accepts a proposed factor (ADR-0026: from today).
 */
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { addDays } from "../../shared/dates";
import { fail, type Result } from "../../shared/result";
import { CONFIDENT, type Calibration } from "../calibration";
import {
  floorKcal,
  goalOnDay,
  goalTargets,
  lastCheckinDay,
  planGoal,
  type GoalPlan,
  type GoalTargets,
} from "../goal";
import { getDayTargetsRange } from "../../nutrition/repositories/profiles";
import { listPrograms } from "../../nutrition/repositories/programs";
import { floorShifts, weekShifts } from "../shift";
import { getCalibration, getEnergyRange, setEnergyCorrection } from "./energy";
import {
  goalFrom,
  listGoals,
  listWeekCheckins,
  recordWeekCheckin,
  type WeightGoal,
} from "./goals";

export type CheckinProposal = {
  goal: WeightGoal;
  /** The latest check-in weekday on or before today. */
  periodStart: string;
  due: boolean;
  /** kcal/day spent over the last 7 days; null without body data. */
  expenditure: number | null;
  /** Whether `expenditure` is the learnt one (else the model's). */
  learnt: boolean;
  /** The last accepted check-in's expenditure, for "was …". */
  previous: number | null;
  /** The factor behind `expenditure`. */
  factor: number;
  /** A factor accepted with the check-in (ADR-0026), if any. */
  proposedFactor: number | null;
  weightKg: number | null;
  /** ADR-0045: the rate planned from the target, for goals with a kind. */
  plan: GoalPlan | null;
  targets: (GoalTargets & { floored: boolean }) | null;
  /** ADR-0044: kcal per day of the coming 7 above or below `targets`. */
  shifts: Record<string, number>;
};

const mid = (r: { low: number; high: number }) => (r.low + r.high) / 2;

/**
 * The check-in as of `today`; null without a goal. A page that already
 * reads the calibration passes it in (it reads 84 days).
 */
export async function getCheckinProposal(
  db: Db,
  owner: Owner,
  today: string,
  calibration?: Promise<Calibration>,
): Promise<CheckinProposal | null> {
  const [goals, checkins] = await Promise.all([
    listGoals(db, owner),
    listWeekCheckins(db, owner),
  ]);
  const goal = goalFrom(goals, today);
  if (!goal) return null;
  const periodStart = lastCheckinDay(today, goal.checkInWeekday);
  const [cal, week, coming, programs] = await Promise.all([
    calibration ?? getCalibration(db, owner, today),
    getEnergyRange(db, owner, addDays(today, -7), addDays(today, -1)),
    getDayTargetsRange(db, owner, today, addDays(today, 6)),
    listPrograms(db, owner),
  ]);
  // Each coming day's type (its copy or the default) and its program's shift.
  const shifts = weekShifts(
    [...coming.entries()].map(([day, t]) => ({
      day,
      shiftKcal:
        (t.source !== "none" && t.profileId && programs.get(t.profileId)?.shiftKcal) || 0,
    })),
  );
  const modelled = [...week.values()].filter((v) => v.energy);
  const learnt =
    cal.verdict === "ok" && cal.sigma <= CONFIDENT && cal.expenditure !== null;
  const expenditure = learnt
    ? Math.round(cal.expenditure!.mid)
    : modelled.length
      ? Math.round(
          modelled.reduce((a, v) => a + mid(v.energy!.total.done), 0) / modelled.length,
        )
      : null;
  const last = modelled.at(-1);
  const weightKg = last?.body.weightKg ? Number(last.body.weightKg) : null;
  const previous = checkins.find((c) => c.decision === "accepted");
  const bmr = last?.energy?.bmr ?? null;
  const targets =
    expenditure !== null && weightKg !== null && bmr !== null
      ? goalTargets(expenditure, goalOnDay(goal, weightKg, today), weightKg, bmr)
      : null;
  return {
    goal,
    periodStart,
    due: goal.weeklyCheckIn && !checkins.some((c) => c.startDay >= periodStart),
    expenditure,
    learnt,
    previous: previous?.decision === "accepted" ? previous.expenditureKcal : null,
    factor: learnt ? cal.factor : cal.current,
    proposedFactor: cal.proposed,
    weightKg,
    plan:
      goal.kind !== null && weightKg !== null
        ? planGoal({ ...goal, kind: goal.kind }, weightKg, today)
        : null,
    targets,
    // The floor holds each day, not only the average (a lighter day never
    // goes under it; the week's total then rises by that much).
    shifts:
      targets && bmr !== null
        ? floorShifts(shifts, targets.kcal, floorKcal(goal.kcalFloor, bmr))
        : Object.fromEntries(shifts),
  };
}

/** Accept (freeze the week from today) or skip the check-in. */
export async function decideCheckin(
  db: Db,
  owner: Owner,
  today: string,
  decision: "accept" | "skip",
): Promise<Result<null>> {
  if (decision === "skip")
    return recordWeekCheckin(db, owner, { startDay: today, decision: "skipped" });
  const p = await getCheckinProposal(db, owner, today);
  if (!p?.targets) return fail({ _form: "required" });
  const { kcal, protein, fat, carbs, fiber } = p.targets;
  const r = await recordWeekCheckin(db, owner, {
    startDay: today,
    decision: "accepted",
    expenditureKcal: p.expenditure,
    factor: Math.min(1.2, Math.max(0.8, p.factor)).toFixed(2), // the table's range
    trendKg: p.weightKg === null ? null : p.weightKg.toFixed(2),
    kcal,
    protein,
    fat,
    carbs,
    fiber,
    shifts: p.shifts,
  });
  if (r.ok && p.proposedFactor !== null)
    await setEnergyCorrection(db, owner, p.proposedFactor, today);
  return r;
}
