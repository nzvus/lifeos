/**
 * core/food/micros.ts — the micronutrients a day's meals brought (kinds.md,
 * E5's list). They come from the catalog's estimates per 100 g of each food
 * (the refined copy's `_estimates`, converted to fields named as E5's
 * micros), times the line's quantity and the entry's servings: estimates,
 * not label values, so a food without them adds nothing. Sodium is the
 * exception: it follows the line's own salt (its snapshot, ADR-0007), as the
 * EU label rule reads it (salt = sodium × 2,5).
 */
import Big from "big.js";
import { MICROS, type Micro } from "../engines/targets";

export const MICRO_FIELDS: readonly string[] = MICROS;
const SODIUM_MG_PER_G_SALT = 400;

export type MicroLine = {
  quantity: string;
  values: Record<string, string>;
  /** The food's estimates per 100, by field ("vitD"); none when unknown. */
  estimates?: Record<string, string>;
};

/** Micro → the amount eaten (mg or µg, as E5's target), only those some food carried. */
export function dayMicros(
  entries: readonly { servings: string | null; lines: readonly MicroLine[] }[],
): Partial<Record<Micro, number>> {
  const sums = new Map<Micro, Big>();
  const add = (m: Micro, v: Big) => sums.set(m, (sums.get(m) ?? new Big(0)).plus(v));
  for (const e of entries) {
    const times = new Big(e.servings ?? "1");
    for (const l of e.lines) {
      const grams = new Big(l.quantity).times(times);
      for (const m of MICROS) {
        if (m === "na") continue;
        const per = l.estimates?.[m];
        if (per !== undefined) add(m, new Big(per).times(grams).div(100));
      }
      const salt = l.values["salt"];
      if (salt !== undefined)
        add("na", new Big(salt).times(grams).div(100).times(SODIUM_MG_PER_G_SALT));
    }
  }
  return Object.fromEntries([...sums].map(([m, v]) => [m, v.toNumber()]));
}
