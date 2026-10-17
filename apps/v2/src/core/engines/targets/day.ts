/**
 * E5 Targets — a day's food targets from the goal and E4 (engines.md E5).
 *   kcal      E(t) − the deficit ± the day model's shift, never under the
 *             floor (the BMR, or 1,200)
 *   protein   1.6–2.2 g per kg of the reference weight (the target weight,
 *             else the trend weight); with a body fat %, 2.3–3.1 g per kg
 *             of lean mass instead (Helms 2014)
 *   fat       the split's share of kcal (25 % by default), never under 20 %
 *             (AMDR) nor 0.6 g/kg
 *   carbs     the rest (v1 ADR-0040); fibre 14 g per 1,000 kcal, at least 25 g
 *   maxima    sugars 90 g per 2,000 kcal (EU RI), saturated fat < 10 % of
 *             kcal (WHO), salt < 5 g (WHO)
 * Micronutrients come from the catalogue's EFSA DRV and UL: a task of its own.
 */

export type ProteinPreference = "low" | "moderate" | "high" | "extra";
export type DietSplit = "balanced" | "low_fat" | "low_carb";

export const PROTEIN_G_PER_KG: Record<ProteinPreference, number> = {
  low: 1.6,
  moderate: 1.8,
  high: 2.0,
  extra: 2.2,
};
/** Helms 2014's 2.3–3.1 g/kg of lean mass, spread over the same four steps. */
export const PROTEIN_G_PER_KG_FFM: Record<ProteinPreference, number> = {
  low: 2.3,
  moderate: 2.57,
  high: 2.83,
  extra: 3.1,
};
export const FAT_SHARE: Record<DietSplit, number> = {
  balanced: 0.25,
  low_fat: 0.2,
  low_carb: 0.35,
};
const FAT_MIN_SHARE = 0.2;
const FAT_MIN_G_PER_KG = 0.6;
const LOW_FLOOR_KCAL = 1200;
const FIBRE_PER_1000 = 14;
const FIBRE_MIN = 25;
const SUGARS_PER_1000 = 45;
const SATURATED_SHARE = 0.1;
const SALT_MAX = 5;

export type DayTargets = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fibre: number;
  /** Maxima. */
  sugars: number;
  saturatedFat: number;
  salt: number;
  /** The floor raised the kcal above what the goal asked. */
  floored: boolean;
};

/** The day's maxima from its kcal: sugars (EU RI), saturated fat (WHO), salt (WHO). */
export function dayMaxima(
  kcal: number,
): Pick<DayTargets, "sugars" | "saturatedFat" | "salt"> {
  return {
    sugars: Math.round((kcal / 1000) * SUGARS_PER_1000),
    saturatedFat: Math.round((kcal * SATURATED_SHARE) / 9),
    salt: SALT_MAX,
  };
}

export function dayTargets(p: {
  /** E4's expenditure for the day (with the plan), kcal. */
  expenditure: number;
  /** E5 `deficitKcal` (negative = a surplus). */
  deficit: number;
  /** The day model's ± kcal (v1 ADR-0046). */
  shiftKcal?: number | undefined;
  bmr: number;
  floor: "bmr" | "low";
  /** E4's trend weight. */
  weightKg: number;
  targetKg?: number | null | undefined;
  bodyFatPct?: number | null | undefined;
  protein: ProteinPreference;
  split: DietSplit;
}): DayTargets {
  const wanted = Math.round(p.expenditure - p.deficit + (p.shiftKcal ?? 0));
  const floor = p.floor === "bmr" ? Math.round(p.bmr) : LOW_FLOOR_KCAL;
  const kcal = Math.max(floor, wanted);
  const protein = Math.round(
    p.bodyFatPct != null
      ? PROTEIN_G_PER_KG_FFM[p.protein] * p.weightKg * (1 - p.bodyFatPct / 100)
      : PROTEIN_G_PER_KG[p.protein] * (p.targetKg ?? p.weightKg),
  );
  const share = Math.max(FAT_MIN_SHARE, FAT_SHARE[p.split]);
  const fat = Math.max(
    Math.round(FAT_MIN_G_PER_KG * p.weightKg),
    Math.round((kcal * share) / 9),
  );
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return {
    kcal,
    protein,
    fat,
    carbs,
    fibre: Math.max(FIBRE_MIN, Math.round((kcal / 1000) * FIBRE_PER_1000)),
    ...dayMaxima(kcal),
    floored: kcal > wanted,
  };
}
