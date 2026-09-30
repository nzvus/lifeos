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
