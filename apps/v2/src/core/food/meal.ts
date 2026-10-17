/**
 * core/food/meal.ts — a meal's lines from the composer (V-04), checked: each
 * names a choice the server read (`readFoodChoices`) and a quantity; the
 * line keeps that choice's values per 100 as its snapshot (ADR-0007) and
 * its name at logging. The meal's own fields (role, time, status) are
 * checked as any entry's (core/entries `checkEntry`).
 */
import type { CheckedLine } from "../entries";
import type { FoodChoice } from "./choices";
import { lineTotals } from "./totals";

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

/** The totals a person may type for a meal they cannot compose (migration.md "estimated"). */
export const ESTIMATE_FIELDS = ["kcal", "protein", "carbs", "fat", "fibre"] as const;
export type EstimateField = (typeof ESTIMATE_FIELDS)[number];
export type EstimateError = "required" | "number" | "too_much";
/** An estimate's confidence, as v1's estimated meals were converted. */
export const ESTIMATE_CONFIDENCE = "0.60";
const ESTIMATE_MAX: Record<EstimateField, number> = {
  kcal: 10000,
  protein: 1000,
  carbs: 1000,
  fat: 1000,
  fibre: 500,
};

/**
 * Typed totals as the meal's one line (migration.md): no food, 100 g, the
 * totals as its values per 100, so every sum reads it like any line. Kcal
 * are needed; the macros are optional; all at most 2 decimals.
 */
export function checkEstimate(
  typed: Partial<Record<EstimateField, string>>,
  name: string,
):
  | { ok: true; line: CheckedLine }
  | { ok: false; at: Partial<Record<EstimateField, EstimateError>> } {
  const at: Partial<Record<EstimateField, EstimateError>> = {};
  const per100: Record<string, string> = {};
  for (const f of ESTIMATE_FIELDS) {
    const raw = (typed[f] ?? "").trim().replace(",", ".");
    if (raw === "") {
      if (f === "kcal") at[f] = "required";
      continue;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) at[f] = "number";
    else if (Number(raw) > ESTIMATE_MAX[f]) at[f] = "too_much";
    else per100[f] = raw;
  }
  if (Object.keys(at).length > 0) return { ok: false, at };
  return {
    ok: true,
    line: {
      itemId: null,
      productId: null,
      name: name.trim() || "Stima",
      quantity: "100",
      unit: "g",
      per100,
    },
  };
}

/**
 * A logged meal typed as an estimate (the one line `checkEstimate` makes,
 * no food): its name and totals, to open it again as typed. A converted
 * meal marked estimated but made of foods is not one: it opens with them.
 */
export function typedEstimate(
  values: Record<string, unknown>,
  lines: readonly {
    itemId: string | null;
    name: string;
    quantity: string;
    values: Record<string, string>;
  }[],
): { name: string; totals: Partial<Record<EstimateField, string>> } | null {
  const [l] = lines;
  if (values["estimated"] !== true || lines.length !== 1 || !l || l.itemId !== null)
    return null;
  const sums = lineTotals([{ quantity: l.quantity, values: l.values }]);
  const totals: Partial<Record<EstimateField, string>> = {};
  for (const f of ESTIMATE_FIELDS) if (sums[f] !== undefined) totals[f] = sums[f];
  return { name: l.name, totals };
}
