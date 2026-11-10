/**
 * core/goals/food.ts — the day's food targets are Obiettivi (MOD-42, FD-20…22, PL-61): three
 * goals hold what a dynamic target needs besides the week's expenditure and trend weight — the
 * deficit used when no weight goal sets the pace (FD-21), protein and fat in g per kg (FD-22).
 * «Rec»'s values were copied into them unchanged (drizzle/0008); a missing one takes the
 * defaults of `core/day/targets`. Each is a plain goal row: `metric.source` names it.
 */
import type { Goal } from "./read";

/** The goals' `metric.source` (decided by the agent: one goal per number, as MOD-42 lists them). */
export const FOOD_GOALS = {
  deficitKcal: "foodDeficit",
  proteinGPerKg: "proteinPerKg",
  fatGPerKg: "fatPerKg",
} as const;

export type FoodParams = {
  deficitKcal: number | null;
  proteinGPerKg: number | null;
  fatGPerKg: number | null;
};

export const NO_FOOD_PARAMS: FoodParams = {
  deficitKcal: null,
  proteinGPerKg: null,
  fatGPerKg: null,
};

/** True for a goal that feeds the day's targets (its row says so instead of a progress). */
export const isFoodGoal = (g: Pick<Goal, "source">) =>
  (Object.values(FOOD_GOALS) as string[]).includes(g.source);

/** Pure: the food parameters in the goals in force (`inForce`), each null when absent. */
export function foodParams(goals: readonly Goal[]): FoodParams {
  const of = (source: string) => goals.find((g) => g.source === source)?.value ?? null;
  return {
    deficitKcal: of(FOOD_GOALS.deficitKcal),
    proteinGPerKg: of(FOOD_GOALS.proteinGPerKg),
    fatGPerKg: of(FOOD_GOALS.fatGPerKg),
  };
}
