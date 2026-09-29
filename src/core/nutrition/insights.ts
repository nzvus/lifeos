/**
 * core/nutrition/insights.ts — small derived numbers that make lists and the
 * day view more informative. Behaviour, so it lives in core (ADR-0002); the
 * components only display the results.
 *
 * All inputs are exact decimal strings or integer cents; results are rounded
 * once, for display (same rule as core/nutrition/totals.ts).
 */
import { Big, toFixedDisplay } from "../shared/decimal";

/** Energy per gram of each macronutrient (standard Atwater factors). */
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

export type MacroSplit = { protein: number; carbs: number; fat: number };

/**
 * Share of energy coming from protein, carbs and fat, in whole percent.
 * Computed from the grams (4/4/9 kcal per g), not from the kcal line, so the
 * three shares always add up to ~100 even when a label's kcal is rounded.
 * null when there is nothing to split.
 */
export function macroSplit(g: {
  protein: string;
  carbs: string;
  fat: string;
}): MacroSplit | null {
  const p = new Big(g.protein).times(KCAL_PER_G.protein);
  const c = new Big(g.carbs).times(KCAL_PER_G.carbs);
  const f = new Big(g.fat).times(KCAL_PER_G.fat);
  const total = p.plus(c).plus(f);
  if (total.eq(0)) return null;
  const pct = (x: Big) => x.div(total).times(100).round(0, Big.roundHalfUp).toNumber();
  return { protein: pct(p), carbs: pct(c), fat: pct(f) };
}

/**
 * Grams of protein per 100 kcal: "how much protein do I get for the energy".
 * The number that ranks whey (~20) above almonds (~4). null for 0 kcal.
 */
export function proteinPer100kcal(per100: {
  kcal: string;
  protein: string;
}): string | null {
  const kcal = new Big(per100.kcal);
  if (kcal.eq(0)) return null;
  return toFixedDisplay(new Big(per100.protein).div(kcal).times(100), 1);
}

/** Price of 1000 g/ml in cents from a package price, or null without a price. */
export function pricePerThousandCents(i: {
  packagePriceCents: number | null;
  packageSize: string | null;
}): number | null {
  if (i.packagePriceCents === null || i.packageSize === null) return null;
  const size = new Big(i.packageSize);
  if (size.eq(0)) return null;
  return new Big(i.packagePriceCents)
    .times(1000)
    .div(size)
    .round(0, Big.roundHalfUp)
    .toNumber();
}
