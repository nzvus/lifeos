/**
 * core/energy/goal.ts — targets from a goal (ADR-0043). Pure.
 *
 *   deficit   the rate as % of body weight a week, turned into kcal a day:
 *             −0.5 % at 76 kg = 0.38 kg a week × 7,700 ÷ 7 = 418 kcal
 *   kcal      what you spend − the deficit, never under the floor
 *             (standard = the BMR, low = 1,200 kcal)
 *   protein   1.6 / 1.8 / 2.0 / 2.2 g per kg of the target weight (of the
 *             current one without a target)
 *   fat       25 / 20 / 35 % of kcal by the split, never under 0.6 g/kg
 *   carbs     the rest (ADR-0040); fibre 14 g per 1,000 kcal
 *
 * A live day with a goal uses goalTargets over that day's expenditure;
 * the weekly check-in uses it over the last 7 days' average and freezes
 * the result for the week, the same each day.
 */
import type { DietSplit, KcalFloor, ProteinPreference } from "../db/schema";

/** kcal in a kilo of body weight change (as in calibration.ts). */
const KCAL_PER_KG = 7700;
export const PROTEIN_G_PER_KG: Record<ProteinPreference, number> = {
  low: 1.6,
  moderate: 1.8,
  high: 2.0,
  extra: 2.2,
};
export const FAT_SHARE: Record<DietSplit, number> = {
  balanced: 0.25,
  low_fat: 0.2,
  low_carb: 0.35,
};
const FAT_MIN_G_PER_KG = 0.6;
const LOW_FLOOR_KCAL = 1200;

export type GoalParams = {
  ratePctWeek: string;
  targetKg: string | null;
  kcalFloor: KcalFloor;
  protein: ProteinPreference;
  split: DietSplit;
};

export type GoalTargets = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
};

/** kcal a day below what you spend (negative = a surplus). */
export function goalDeficit(ratePctWeek: string, weightKg: number): number {
  return Math.round((-Number(ratePctWeek) / 100) * weightKg * (KCAL_PER_KG / 7)) || 0; // never −0
}

export function floorKcal(floor: KcalFloor, bmr: number): number {
  return floor === "standard" ? Math.round(bmr) : LOW_FLOOR_KCAL;
}

/** Whether the goal loses weight (the bands keep protein higher then). */
export const isCutting = (g: Pick<GoalParams, "ratePctWeek">) =>
  Number(g.ratePctWeek) < 0;

export function goalTargets(
  expenditureKcal: number,
  goal: GoalParams,
  weightKg: number,
  bmr: number,
): GoalTargets & { floored: boolean } {
  const wanted = Math.round(expenditureKcal - goalDeficit(goal.ratePctWeek, weightKg));
  const floor = floorKcal(goal.kcalFloor, bmr);
  const kcal = Math.max(floor, wanted);
  const proteinKg = goal.targetKg === null ? weightKg : Number(goal.targetKg);
  const protein = Math.round(PROTEIN_G_PER_KG[goal.protein] * proteinKg);
  const fat = Math.max(
    Math.round(FAT_MIN_G_PER_KG * weightKg),
    Math.round((kcal * FAT_SHARE[goal.split]) / 9),
  );
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return {
    kcal,
    protein,
    fat,
    carbs,
    fiber: Math.round((kcal / 1000) * 14),
    floored: kcal > wanted,
  };
}

/**
 * The day the current check-in period started: the latest `weekday` on or
 * before `today` (0 = Sunday … 6 = Saturday).
 */
export function lastCheckinDay(today: string, weekday: number): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() - weekday + 7) % 7));
  return d.toISOString().slice(0, 10);
}
