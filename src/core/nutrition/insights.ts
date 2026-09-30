/**
 * core/nutrition/insights.ts — small derived numbers that make lists and the
 * day view more informative. Behaviour, so it lives in core (ADR-0002); the
 * components only display the results.
 *
 * All inputs are exact decimal strings or integer cents; results are rounded
 * once, for display (same rule as core/nutrition/totals.ts).
 */
import { Big } from "../shared/decimal";

/**
 * Energy per gram (EU Regulation 1169/2011, Annex XIV): protein and carbs
 * 4, fat 9, fibre 2. Carbs on EU labels exclude fibre, so fibre is its own
 * share.
 */
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9, fiber: 2 } as const;

/**
 * Whole percent of energy. `sugars` is the part of `carbs`, `saturatedFat`
 * the part of `fat` (both already included in them), so protein + carbs +
 * fat + fiber is ~100.
 */
export type MacroSplit = {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugars: number;
  saturatedFat: number;
};

/**
 * Share of energy from each macronutrient, in whole percent. Computed from
 * the grams, not from the kcal line, so the shares always add up to ~100
 * even when a label's kcal is rounded. Missing sugars/saturated fat/fibre
 * count as 0 (sub-shares larger than their macro are capped at it). null
 * when there is nothing to split.
 */
export function macroSplit(g: {
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  sugars?: string;
  saturatedFat?: string;
}): MacroSplit | null {
  const kcal = (grams: string | undefined, per: number) =>
    new Big(grams ?? "0").times(per);
  const p = kcal(g.protein, KCAL_PER_G.protein);
  const c = kcal(g.carbs, KCAL_PER_G.carbs);
  const f = kcal(g.fat, KCAL_PER_G.fat);
  const fi = kcal(g.fiber, KCAL_PER_G.fiber);
  const min = (a: Big, b: Big) => (a.lt(b) ? a : b);
  const su = min(kcal(g.sugars, KCAL_PER_G.carbs), c);
  const sa = min(kcal(g.saturatedFat, KCAL_PER_G.fat), f);
  const total = p.plus(c).plus(f).plus(fi);
  if (total.eq(0)) return null;
  const pct = (x: Big) => x.div(total).times(100).round(0, Big.roundHalfUp).toNumber();
  return {
    protein: pct(p),
    carbs: pct(c),
    fat: pct(f),
    fiber: pct(fi),
    sugars: pct(su),
    saturatedFat: pct(sa),
  };
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

/** The exact mean of decimal strings, or null for an empty list. */
export function average(values: readonly string[]): string | null {
  if (values.length === 0) return null;
  return values
    .reduce((sum, v) => sum.plus(v), new Big(0))
    .div(values.length)
    .toString();
}
