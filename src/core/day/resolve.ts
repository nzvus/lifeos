/**
 * core/day/resolve.ts — ONE answer to "what does this day ask for?"
 * (ADR-0040). Pure: the day's type (its stored copy or the default), what
 * the day costs (core/energy), and the user's preference for automatic
 * maxima in; the day's targets, their bands and its training load out.
 *
 * Every screen (Today, the week strip, the Plan, Settings, Trends) and the
 * assistant read a day through this, so the same day shows the same numbers.
 * The data for any range of days comes from ./repositories/days.ts.
 */
import { dynamicTargets, goalOf, type Energy, type Goal } from "../energy/energy";
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

export function resolveDay(
  day: string,
  plan: DayTargets,
  energy: DayEnergyView,
  options: { autoTargets: boolean },
): ResolvedDay {
  const dynamic = plan.source !== "none" ? plan.dynamic : null;
  const kg = energy.body.weightKg;
  const computed =
    dynamic && energy.energy && kg ? dynamicTargets(energy.energy, kg, dynamic) : null;
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
          cutting: (dynamic?.deficitKcal ?? 0) > 0,
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
    own,
    targets,
    auto,
    bands,
  };
}
