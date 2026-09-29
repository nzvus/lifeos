/**
 * core/shared/decimal.ts — exact decimal arithmetic for grams, kcal and money.
 *
 * Why not plain `number`: 0.1 + 0.2 === 0.30000000000000004 in JavaScript.
 * Summing a day of meals in floats accumulates such errors, and a total that
 * silently differs from the sum of its parts breaks PROJECT.md's "totals =
 * parts" invariant. big.js does base-10 arithmetic, like Postgres `numeric`.
 *
 * Rule used across the app: values stay exact (Big objects or decimal strings)
 * through every calculation, and are rounded ONLY when turned into text for
 * display.
 *
 * Pure module. Used by core/nutrition/totals.ts and core/nutrition/validation.ts.
 */
import Big from "big.js";

export { Big };

/**
 * Parses user input like "12,5" or " 12.5 " into a canonical decimal string
 * ("12.5"), or returns null if it is not a plain non-negative decimal.
 * Accepting a comma matters: Italian keyboards and habits write 12,5.
 */
export function parseDecimalInput(raw: string): string | null {
  const s = raw.trim().replace(",", ".");
  // Digits, optionally a dot followed by more digits. No sign, no exponent.
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  // new Big(...).toString() normalises "007.50" to "7.5".
  return new Big(s).toString();
}

/** Rounds for display: 1 decimal by default ("12.35" -> "12.4"). */
export function toFixedDisplay(value: Big | string, decimals = 1): string {
  // Big.roundHalfUp: the rounding everyone learned at school (x.5 goes up).
  return new Big(value).round(decimals, Big.roundHalfUp).toFixed(decimals);
}
