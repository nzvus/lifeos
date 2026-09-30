/**
 * core/nutrition/preview.ts — what an entry WOULD add to the day, computed
 * while the user types in the "add to the day" widget, before anything is
 * saved. Pure and exact (big.js), like totals.ts; the saved entry is still
 * computed by totals.ts from its snapshot (ADR-0007), this is only a preview.
 *
 *   meal        per-serving values × servings        (per = "1")
 *   ingredient  per-100 values × quantity / 100      (per = "100")
 *   estimate    the typed values themselves          (estimateValues)
 */
import { Big, parseDecimalInput } from "../shared/decimal";

export const PREVIEW_KEYS = ["kcal", "protein", "carbs", "fat", "fiber"] as const;
export type PreviewKey = (typeof PREVIEW_KEYS)[number];
export type MacroValues = Record<PreviewKey, string>;

/** values × amount / per; null while the amount is not a positive number. */
export function scaleMacros(
  values: MacroValues,
  amount: string,
  per: "1" | "100",
): MacroValues | null {
  const parsed = parseDecimalInput(amount);
  if (parsed === null || new Big(parsed).lte(0)) return null;
  const factor = new Big(parsed).div(per);
  const out = {} as MacroValues;
  for (const k of PREVIEW_KEYS) out[k] = new Big(values[k]).times(factor).toString();
  return out;
}

/**
 * The typed values of an estimated meal; empty macros count as 0. null while
 * kcal (the one required field) is missing or any field is not a number.
 */
export function estimateValues(typed: Record<PreviewKey, string>): MacroValues | null {
  const out = {} as MacroValues;
  for (const k of PREVIEW_KEYS) {
    const raw = typed[k].trim();
    if (raw === "") {
      if (k === "kcal") return null;
      out[k] = "0";
      continue;
    }
    const parsed = parseDecimalInput(raw);
    if (parsed === null) return null;
    out[k] = parsed;
  }
  return out;
}

/** The sum of several previews (a meal's lines). */
export function sumMacros(parts: readonly MacroValues[]): MacroValues {
  const out = {} as MacroValues;
  for (const k of PREVIEW_KEYS)
    out[k] = parts.reduce((sum, p) => sum.plus(p[k]), new Big(0)).toString();
  return out;
}

/**
 * A meal's per-serving values if one of its ingredients changed from
 * `before` to `after` (both per 100), used `quantity` per serving:
 * meal − quantity × before + quantity × after. Exact.
 */
export function replaceIngredient(
  meal: MacroValues,
  quantity: string,
  before: MacroValues,
  after: MacroValues,
): MacroValues {
  const q = new Big(quantity).div(100);
  const out = {} as MacroValues;
  for (const k of PREVIEW_KEYS)
    out[k] = new Big(meal[k])
      .minus(q.times(before[k]))
      .plus(q.times(after[k]))
      .toString();
  return out;
}

/** Whole-percent change from `before` to `after`; null when before is 0. */
export function percentChange(before: string, after: string): number | null {
  const b = new Big(before);
  if (b.eq(0)) return null;
  return new Big(after).minus(b).div(b).times(100).round(0, Big.roundHalfUp).toNumber();
}

/** A meal that uses an ingredient: how much per serving, and its serving. */
export type MealUse = {
  id: string;
  name: string;
  quantity: string;
  serving: MacroValues;
};

/**
 * The meals that use `ingredientId`, with the quantity per serving (summed
 * if it appears on several lines) and the meal's per-serving values — what
 * the ingredient editor needs to show the effect of a label change.
 */
export function mealsUsing(
  meals: readonly {
    id: string;
    name: string;
    lines: readonly { ingredientId: string; quantity: string }[];
    totals: { nutrients: MacroValues };
  }[],
  ingredientId: string,
): MealUse[] {
  return meals.flatMap((m) => {
    const quantity = m.lines
      .filter((l) => l.ingredientId === ingredientId)
      .reduce((sum, l) => sum.plus(l.quantity), new Big(0));
    if (quantity.eq(0)) return [];
    const serving = {} as MacroValues;
    for (const k of PREVIEW_KEYS) serving[k] = m.totals.nutrients[k];
    return [{ id: m.id, name: m.name, quantity: quantity.toString(), serving }];
  });
}
