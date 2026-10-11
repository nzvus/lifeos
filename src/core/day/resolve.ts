/**
 * core/day/resolve.ts — ONE answer to "what does this day ask for?"
 * (ADR-0040). Pure: the day's type (its stored copy or the default), what
 * the day costs (core/energy), and the user's preference for automatic
 * maxima in; the day's targets, their bands and its training load out.
 *
 * Every screen (Today, the week strip, the Plan, Settings, Trends) and the
 * assistant read a day through this, so the same day shows the same numbers.
 *
 * A dynamic day's numbers (ADR-0043), first that applies:
 *   1. an accepted weekly check-in covers the day → its frozen numbers;
 *   2. a goal is in force → computed from the day's cost and the goal;
 *   3. else → the day type's own parameters (ADR-0014).
 * The data for any range of days comes from ./repositories/days.ts.
 */
import {
  dynamicTargets,
  goalOf,
  type DynamicParams,
  type Energy,
  type Goal,
} from "../energy/energy";
import { goalOnDay, goalTargets, isCutting } from "../energy/goal";
import { shiftDay } from "../energy/shift";
import type { AcceptedCheckin, WeightGoal } from "../energy/repositories/goals";
import type { DayEnergyView } from "../energy/repositories/energy";
import {
  macroBands,
  trainingLoad,
  type Bands,
  type TrainingLoad,
} from "../nutrition/bands";
import type { NutrientKey } from "../nutrition/nutrients";
import {
  emptyTargets,
  type DayTargets,
  type DynamicPlan,
} from "../nutrition/repositories/profiles";
import { withAutoTargets, type Targets } from "../nutrition/targets";

export type ResolvedDay = {
  day: string;
  /** The day's type: its stored copy, the default type, or none (ADR-0008). */
  plan: DayTargets;
  /** A dynamic type's parameters, else null. */
  dynamic: DynamicPlan | null;
  goal: Goal | "custom" | null;
  /** What the day costs (body, activity, energy ranges). */
  energy: DayEnergyView;
  /** Training load of the day, done + planned (ADR-0023). */
  load: TrainingLoad;
  /** Computed numbers of a dynamic day; null for fixed days or without body data. */
  computed: ReturnType<typeof dynamicTargets> | null;
  /** Where a dynamic day's numbers come from (ADR-0043); null otherwise. */
  basis: "checkin" | "goal" | "type" | null;
  /**
   * The parameters the day's numbers amount to: the type's own, or — from
   * a goal or a check-in — the deficit against the day's cost and protein
   * and fat per kg (ADR-0043). For the goal line and the formulas.
   */
  params: DynamicParams | null;
  /** The goal in force on the day (ADR-0043), dynamic or not. */
  weightGoal: WeightGoal | null;
  /** The accepted check-in covering the day (ADR-0043), or null. */
  checkin: AcceptedCheckin | null;
  /** The day's own targets (fixed copy, or computed). */
  own: Targets;
  /** `own` plus the automatic maxima, unless turned off. */
  targets: Targets;
  /** Which of `targets` are automatic. */
  auto: NutrientKey[];
  /** Floor / good / ceiling per macro; needs a weight (ADR-0023/0025). */
  bands: Bands | undefined;
};

/**
 * The day's training load from the energy model's sessions (done and
 * planned, the program's included): minutes, and cardio minutes for "long".
 */
export function loadOf(energy: Energy | null): TrainingLoad {
  const sessions = energy?.inputs.sessions ?? [];
  return trainingLoad(
    sessions.reduce((a, x) => a + x.durationMin, 0),
    sessions.reduce((a, x) => a + (x.basis?.kind === "sets" ? x.basis.cardioMin : 0), 0),
  );
}

const mid = (r: { low: number; high: number }) => (r.low + r.high) / 2;

export function resolveDay(
  day: string,
  plan: DayTargets,
  energy: DayEnergyView,
  options: { autoTargets: boolean },
  context: { goal: WeightGoal | null; checkin: AcceptedCheckin | null } = {
    goal: null,
    checkin: null,
  },
): ResolvedDay {
  const dynamic = plan.source !== "none" ? plan.dynamic : null;
  const kg = energy.body.weightKg;
  const { goal, checkin } = context;
  const e = energy.energy;
  const [computed, basis]: [
    ReturnType<typeof dynamicTargets> | null,
    ResolvedDay["basis"],
  ] = !dynamic
    ? [null, null]
    : checkin
      ? [
          // ADR-0044: the week's numbers with this day's shift (carbs take it).
          shiftDay(
            {
              kcal: checkin.kcal,
              protein: checkin.protein,
              fat: checkin.fat,
              carbs: checkin.carbs,
              fiber: checkin.fiber,
            },
            checkin.shifts?.[day] ?? 0,
          ),
          "checkin",
        ]
      : goal && e && kg
        ? [
            // ADR-0045: the rate planned from the target at this day's weight.
            goalTargets(
              mid(e.total.withPlan),
              goalOnDay(goal, Number(kg), day),
              Number(kg),
              e.bmr,
            ),
            "goal",
          ]
        : e && kg
          ? [dynamicTargets(e, kg, dynamic), "type"]
          : [null, goal ? "goal" : "type"];
  const own: Targets =
    plan.source === "none"
      ? emptyTargets()
      : computed
        ? {
            ...emptyTargets(),
            kcal: String(computed.kcal),
            protein: String(computed.protein),
            fat: String(computed.fat),
            carbs: String(computed.carbs),
            fiber: String(computed.fiber),
          }
        : dynamic
          ? emptyTargets() // dynamic, but body data is missing: no numbers
          : plan.targets;
  const params: DynamicParams | null =
    !dynamic || basis === "type" || !computed || !e || !kg
      ? dynamic
      : {
          deficitKcal: Math.round(mid(e.total.withPlan) - computed.kcal),
          proteinGPerKg: (computed.protein / Number(kg)).toFixed(1),
          fatGPerKg: (computed.fat / Number(kg)).toFixed(1),
        };
  const { targets, auto } = options.autoTargets
    ? withAutoTargets(own)
    : { targets: own, auto: [] as NutrientKey[] };
  const load = loadOf(energy.energy);
  const bands =
    kg === null
      ? undefined
      : macroBands({
          kg: Number(kg),
          kcal: targets.kcal === null ? null : Number(targets.kcal),
          load,
          cutting: goal
            ? goal.kind === "lose" || (goal.kind === null && isCutting(goal))
            : (dynamic?.deficitKcal ?? 0) > 0,
          carbsTarget: targets.carbs === null ? null : Number(targets.carbs),
        });
  return {
    day,
    plan,
    dynamic,
    goal: dynamic ? (goalOf(dynamic) ?? "custom") : null,
    energy,
    load,
    computed,
    basis,
    params,
    // The goal with the pace planned for this day at this weight, so every
    // place that shows the rate shows the one the numbers use (2026-10-11:
    // the header said the stored −0.49 %, the explanation the planned 0.50 %).
    weightGoal: goal && kg ? goalOnDay(goal, Number(kg), day) : goal,
    checkin,
    own,
    targets,
    auto,
    bands,
  };
}
