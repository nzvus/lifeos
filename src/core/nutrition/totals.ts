/**
 * core/nutrition/totals.ts — the ONE place where nutrition and cost totals are
 * computed (ADR-0003: "totals are computed on read in a single core/ function,
 * with no stored aggregates").
 *
 * PROJECT.md invariant "totals = parts": a meal's or a day's totals always
 * equal the sum of their entries. It holds by construction because:
 *   1. no total is ever stored in the database (nothing can go stale), and
 *   2. every screen gets its totals from these functions (the UI never sums).
 *
 * Model: an ingredient declares nutrients per 100 g (or per 100 ml). A line
 * uses some quantity of it. Contribution = per100 * quantity / 100.
 * Cost: an ingredient optionally has a package price (integer cents — ADR-0003
 * "money as integer minor units") and a package size in the same unit.
 * Cost of a line = priceCents * quantity / packageSize.
 *
 * Pure module. Used by core/nutrition/repositories/* (server). Tested in
 * totals.test.ts.
 */
import { Big, toFixedDisplay } from "../shared/decimal";
import { NUTRIENT_KEYS, type NutrientKey, type NutrientValues } from "./nutrients";

/** The minimum a line needs for totals: how much, what's in it, what it costs. */
export type TotalsLine = {
  /** Amount used, in the ingredient's unit (g or ml), as a decimal string. */
  quantity: string;
  /** Nutrients per 100 units of the ingredient. */
  per100: NutrientValues;
  /** Price of one package in cents, or null if unknown. */
  packagePriceCents: number | null;
  /** Size of that package in the same unit as `quantity`, or null. */
  packageSize: string | null;
};

/** Exact totals: Big values, never rounded. Stays inside core/. */
export type ExactTotals = {
  nutrients: Record<NutrientKey, Big>;
  /** Cost in cents, exact (can be fractional: 3 g of a 1 €/kg item). */
  costCents: Big;
  /**
   * false if at least one line had no price. The cost is then a lower bound,
   * and the UI must say so instead of showing a falsely precise number.
   */
  costComplete: boolean;
};

/**
 * Totals ready for display: plain strings/numbers, rounded ONCE, at the very
 * end. Plain data (no Big objects) because it is passed from server
 * components to client components, which requires serialisable values.
 */
export type DisplayTotals = {
  nutrients: Record<NutrientKey, string>;
  /** Whole cents (integer), rounded half-up from the exact cost. */
  costCents: number;
  costComplete: boolean;
};

function emptyTotals(): ExactTotals {
  const nutrients = {} as Record<NutrientKey, Big>;
  for (const k of NUTRIENT_KEYS) nutrients[k] = new Big(0);
  return { nutrients, costCents: new Big(0), costComplete: true };
}

/**
 * Sums a list of lines, each multiplied by `factor` (e.g. "1.5" when one and a
 * half servings of a meal were eaten). An empty list gives zeros.
 */
export function sumLines(lines: readonly TotalsLine[], factor = "1"): ExactTotals {
  const total = emptyTotals();
  const f = new Big(factor);
  for (const line of lines) {
    const qty = new Big(line.quantity).times(f);
    for (const k of NUTRIENT_KEYS) {
      // per100 * qty / 100 — multiply first, divide last, to keep precision.
      total.nutrients[k] = total.nutrients[k].plus(
        new Big(line.per100[k]).times(qty).div(100),
      );
    }
    const size = line.packageSize === null ? null : new Big(line.packageSize);
    if (line.packagePriceCents === null || size === null || size.eq(0)) {
      total.costComplete = false; // unknown price: remember it, don't guess
    } else {
      total.costCents = total.costCents.plus(
        new Big(line.packagePriceCents).times(qty).div(size),
      );
    }
  }
  return total;
}

/** Adds several exact totals together (a day = sum of its entries). */
export function addTotals(parts: readonly ExactTotals[]): ExactTotals {
  const total = emptyTotals();
  for (const p of parts) {
    for (const k of NUTRIENT_KEYS) {
      total.nutrients[k] = total.nutrients[k].plus(p.nutrients[k]);
    }
    total.costCents = total.costCents.plus(p.costCents);
    total.costComplete = total.costComplete && p.costComplete;
  }
  return total;
}

/**
 * Converts exact totals to display values. This is the ONLY rounding step.
 *
 * Consequence worth understanding: a displayed day total can differ by a
 * tenth from the sum of the displayed (rounded) entry totals. That is correct:
 * the exact values add up; rounded values are only labels. Summing rounded
 * labels would be the actual bug.
 */
export function toDisplay(t: ExactTotals): DisplayTotals {
  const nutrients = {} as Record<NutrientKey, string>;
  for (const k of NUTRIENT_KEYS) nutrients[k] = toFixedDisplay(t.nutrients[k], 1);
  return {
    nutrients,
    costCents: t.costCents.round(0, Big.roundHalfUp).toNumber(),
    costComplete: t.costComplete,
  };
}
