/**
 * core/food/meal.ts — a meal's lines from the composer (V-04), checked: each
 * names a choice the server read (`readFoodChoices`) and a quantity; the
 * line keeps that choice's values per 100 as its snapshot (ADR-0007) and
 * its name at logging. The meal's own fields (role, time, status) are
 * checked as any entry's (core/entries `checkEntry`).
 */
import type { CheckedLine } from "../entries";
import type { FoodChoice } from "./choices";

export type LineInput = { key: string; quantity: string };
export type LineError = "unknown" | "quantity" | "too_much";
export type LinesError = "empty" | "too_many";

const QUANTITY = /^\d+([.,]\d{1,2})?$/; // the column keeps 2 decimals
const MAX_QUANTITY = 5000;
const MAX_LINES = 40;

export function checkMealLines(
  lines: readonly LineInput[],
  choices: ReadonlyMap<string, FoodChoice>,
):
  | { ok: true; lines: CheckedLine[] }
  | { ok: false; lines?: LinesError; at: Record<number, LineError> } {
  if (lines.length === 0) return { ok: false, lines: "empty", at: {} };
  if (lines.length > MAX_LINES) return { ok: false, lines: "too_many", at: {} };
  const at: Record<number, LineError> = {};
  const out: CheckedLine[] = [];
  lines.forEach((l, i) => {
    const c = choices.get(l.key);
    const q = l.quantity.trim().replace(",", ".");
    if (!c) at[i] = "unknown";
    else if (!QUANTITY.test(q) || Number(q) <= 0) at[i] = "quantity";
    else if (Number(q) > MAX_QUANTITY) at[i] = "too_much";
    else
      out.push({
        itemId: c.foodId,
        productId: c.productId,
        name: c.name,
        quantity: q,
        unit: c.unit,
        per100: c.per100,
      });
  });
  return Object.keys(at).length > 0 ? { ok: false, at } : { ok: true, lines: out };
}
