/**
 * E2 Metrics, first part (engines.md E2): exact sums, streaks, regularity.
 * Sums of nutrients and money are exact decimals (big.js), rounded once at
 * display: v1's invariant "totals = parts".
 */
import Big from "big.js";

/** Exact sum of decimal strings or numbers; returned as a string, never rounded here. */
export function exactSum(values: readonly (string | number)[]): string {
  return values.reduce<Big>((a, v) => a.plus(v), new Big(0)).toString();
}

export type WindowResult = "met" | "missed" | "excused" | "unknown";

/**
 * Consecutive windows meeting the target, counted back from the latest.
 * - "excused": a skipped entry with a reason (sick, travel); with `excusedKeeps` it is
 *   neither counted nor breaking, else it breaks like a miss.
 * - "unknown" (no data): breaks, because it cannot be shown as met.
 * - The latest window may still be open: if it is not met yet, the streak counts from the one before.
 */
export function streak(
  results: readonly WindowResult[],
  opts: { excusedKeeps: boolean; lastIsOpen: boolean },
): number {
  let i = results.length - 1;
  if (opts.lastIsOpen && i >= 0 && results[i] !== "met") i--;
  let n = 0;
  for (; i >= 0; i--) {
    const r = results[i];
    if (r === "met") n++;
    else if (r === "excused" && opts.excusedKeeps) continue;
    else break;
  }
  return n;
}

/** Regularity = 1 − coefficient of variation, clamped to [0, 1]; null under two values or a zero mean. */
export function regularity(values: readonly number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return null;
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
  return Math.min(1, Math.max(0, 1 - sd / Math.abs(mean)));
}

const DAY_MIN = 24 * 60;

/**
 * Times of day on a circle (minutes after midnight): 23:50 and 00:10 are 20 minutes apart,
 * not 23 hours. Returns the circular mean minute and the circular SD in minutes.
 */
export function circularTime(
  minutes: readonly number[],
): { mean: number; sdMin: number } | null {
  if (minutes.length === 0) return null;
  const a = minutes.map((m) => (m / DAY_MIN) * 2 * Math.PI);
  const s = a.reduce((x, t) => x + Math.sin(t), 0) / a.length;
  const c = a.reduce((x, t) => x + Math.cos(t), 0) / a.length;
  const r = Math.min(1, Math.hypot(s, c));
  const mean = ((Math.atan2(s, c) / (2 * Math.PI)) * DAY_MIN + DAY_MIN) % DAY_MIN;
  const sd = r === 0 ? Infinity : Math.sqrt(-2 * Math.log(r));
  return { mean: Math.round(mean), sdMin: (sd / (2 * Math.PI)) * DAY_MIN };
}
