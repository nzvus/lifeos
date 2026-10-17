/**
 * E4 Body state — what a kilo of body weight change is worth (engines.md E4):
 * not a flat 7,700 kcal. A change is part fat (≈ 9,440 kcal/kg) and part lean
 * tissue with its water (≈ 1,820 kcal/kg) (Hall 2008). The fat share follows
 * Forbes's curve: the more fat a body has, the more of a change is fat
 * (dLean/dFat = 10.4 / FM, Forbes 1987, as used by Hall 2008).
 * The density is asymmetric: losing and gaining each take their own fat
 * share. Both default to Forbes's; E6 may pass a leaner share for a gain
 * under resistance training.
 */

export const FAT_KCAL_PER_KG = 9440;
export const LEAN_KCAL_PER_KG = 1820;
/** Forbes's constant, kg. */
const FORBES = 10.4;

/** The share of a weight change that is fat, for a body with `fatKg` of fat. */
export function forbesFatShare(fatKg: number): number {
  if (!(fatKg > 0)) throw new RangeError(`fat mass must be positive, got ${fatKg}`);
  return fatKg / (fatKg + FORBES);
}

/** kcal per kg of change with this fat share. */
export function densityOf(fatShare: number): number {
  return fatShare * FAT_KCAL_PER_KG + (1 - fatShare) * LEAN_KCAL_PER_KG;
}

/**
 * Body fat %, when not measured, from BMI, age and sex (Deurenberg 1991):
 * 1.2 × BMI + 0.23 × age − 10.8 × (1 for men) − 5.4. An estimate for the prior only.
 */
export function estimatedBodyFatPct(
  kg: number,
  heightCm: number,
  age: number,
  sex: "male" | "female",
): number {
  const bmi = kg / (heightCm / 100) ** 2;
  return 1.2 * bmi + 0.23 * age - 10.8 * (sex === "male" ? 1 : 0) - 5.4;
}

export type Density = { loss: number; gain: number };

/** The density of loss and gain for a body: Forbes's share for both unless given. */
export function bodyDensity(
  kg: number,
  bodyFatPct: number,
  gainFatShare?: number,
): Density {
  const share = forbesFatShare((kg * bodyFatPct) / 100);
  return { loss: densityOf(share), gain: densityOf(gainFatShare ?? share) };
}
