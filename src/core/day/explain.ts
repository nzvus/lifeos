/**
 * core/day/explain.ts — how a dynamic day's numbers were built, in four
 * steps (refactor plan §5, Phase 2: "how was each number built"; the
 * developer, 2026-10-10: "I don't understand"). Pure: it reads the day the
 * engine resolved and says what each step added; it computes nothing new.
 *
 *   1. what you spend    BMR, everyday activity, steps, training
 *   2. the goal          the pace and the kcal it adds or takes; or the
 *                        numbers a check-in fixed for the week
 *   3. the floor         when it held the kcal up
 *   4. the split         protein per kg, fat as a share, carbs the rest
 */
import { goalDeficit, goalKind, goalOnDay } from "../energy/goal";
import type { GoalKind } from "../db/schema";
import type { ResolvedDay } from "./resolve";

const mid = (r: { low: number; high: number }) => Math.round((r.low + r.high) / 2);

export type DayExplained = {
  spend: {
    total: number;
    bmr: number;
    everyday: number;
    steps: number;
    training: number;
  };
  /** Where the kcal come from. */
  source:
    | { type: "goal"; kind: GoalKind; ratePctWeek: number; kcalPerDay: number }
    | { type: "checkin"; startDay: string; expenditure: number | null; shift: number }
    | { type: "type"; deficit: number };
  kcal: number;
  /** The floor held the kcal up (kcal it added); null when it didn't. */
  floored: number | null;
  protein: { g: number; perKg: number; ofKg: number };
  fat: { g: number; sharePct: number };
  carbs: { g: number };
};

export function explainDay(d: ResolvedDay): DayExplained | null {
  const e = d.energy.energy;
  const c = d.computed;
  const kg = d.energy.body.weightKg === null ? null : Number(d.energy.body.weightKg);
  if (!e || !c || kg === null || !d.params) return null;
  const total = mid(e.total.withPlan);
  const steps = mid(e.walking);
  const training = mid(e.training.done) + mid(e.training.planned);
  // The rest, so the parts add up to the total exactly (rounding included).
  const everyday = total - Math.round(e.bmr) - steps - training;
  const goal = d.weightGoal;
  // What the goal asked before any floor (the engine's params already
  // include it): the pace planned for this day at this weight (ADR-0045).
  const planned =
    d.basis === "goal" && goal ? Number(goalOnDay(goal, kg, d.day).ratePctWeek) : null;
  const deficit =
    planned === null ? d.params.deficitKcal : goalDeficit(planned.toFixed(2), kg);
  const wanted = total - deficit;
  const proteinKg = d.basis === "goal" && goal?.targetKg ? Number(goal.targetKg) : kg;
  const source: DayExplained["source"] =
    d.basis === "checkin" && d.checkin
      ? {
          type: "checkin",
          startDay: d.checkin.startDay,
          expenditure: d.checkin.expenditureKcal,
          shift: d.checkin.shifts?.[d.day] ?? 0,
        }
      : d.basis === "goal" && goal && planned !== null
        ? {
            type: "goal",
            kind: goalKind(goal),
            ratePctWeek: planned,
            kcalPerDay: -deficit,
          }
        : { type: "type", deficit };
  return {
    spend: { total, bmr: Math.round(e.bmr), everyday, steps, training },
    source,
    kcal: c.kcal,
    // The engine's own kcal never sits under what the deficit asked unless
    // a floor held it up (goal days: the BMR or 1,200; type days: 1,200).
    floored: d.basis !== "checkin" && c.kcal > wanted + 1 ? c.kcal - wanted : null,
    protein: {
      g: c.protein,
      perKg: Math.round((c.protein / proteinKg) * 10) / 10,
      ofKg: proteinKg,
    },
    fat: { g: c.fat, sharePct: Math.round(((c.fat * 9) / c.kcal) * 100) },
    carbs: { g: c.carbs },
  };
}
