/**
 * core/energy/repositories/checkin.ts — the weekly check-in (ADR-0043):
 * whether one is due, what it proposes, and accepting or skipping it.
 *
 *   due          a goal is in force and no check-in was made since the
 *                latest check-in weekday (the first one is due at once)
 *   expenditure  the last 7 days' average: learnt (ADR-0041) when its
 *                factor is known within ± 0.05, else the model with the
 *                accepted factor
 *   targets      goalTargets over it, the same for each of the 7 days
 *
 * The numbers are computed again on accept, never taken from the form.
 * Accepting also accepts a proposed factor (ADR-0026: from today).
 */
import type { Db } from "../../db/client";
import type { Owner } from "../../identity/owner";
import { addDays } from "../../shared/dates";
import { fail, type Result } from "../../shared/result";
import { CONFIDENT, type Calibration } from "../calibration";
import { goalTargets, lastCheckinDay, type GoalTargets } from "../goal";
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
  targets: (GoalTargets & { floored: boolean }) | null;
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
  const [cal, week] = await Promise.all([
    calibration ?? getCalibration(db, owner, today),
    getEnergyRange(db, owner, addDays(today, -7), addDays(today, -1)),
  ]);
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
  return {
    goal,
    periodStart,
    due: !checkins.some((c) => c.startDay >= periodStart),
    expenditure,
    learnt,
    previous: previous?.decision === "accepted" ? previous.expenditureKcal : null,
    factor: learnt ? cal.factor : cal.current,
    proposedFactor: cal.proposed,
    weightKg,
    targets:
      expenditure !== null && weightKg !== null && last?.energy
        ? goalTargets(expenditure, goal, weightKg, last.energy.bmr)
        : null,
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
  });
  if (r.ok && p.proposedFactor !== null)
    await setEnergyCorrection(db, owner, p.proposedFactor, today);
  return r;
}
