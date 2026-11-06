/**
 * core/food/totals.ts — what a composite entry adds up to (v1's invariant:
 * a meal's totals are the sum of its lines, computed on read, exact, rounded
 * once at display). Each line holds its snapshot per 100 (ADR-0007): a line
 * gives value × quantity / 100, times the entry's servings.
 */
import Big from "big.js";

export type SnapshotLine = { quantity: string; values: Record<string, string> };

/** Field → exact total (a decimal string), over the fields any line has. */
export function lineTotals(
  lines: readonly SnapshotLine[],
  servings: string | null = null,
): Record<string, string> {
  const times = new Big(servings ?? "1");
  const sums = new Map<string, Big>();
  for (const l of lines) {
    const qty = new Big(l.quantity).times(times);
    for (const [field, v] of Object.entries(l.values))
      sums.set(
        field,
        (sums.get(field) ?? new Big(0)).plus(new Big(v).times(qty).div(100)),
      );
  }
  return Object.fromEntries([...sums].map(([f, v]) => [f, v.toString()]));
}
