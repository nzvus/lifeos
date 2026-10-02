/**
 * core/nutrition/servings.ts — the multiplier of a logged entry, one tap
 * at a time (developer's request, 2026-10-02): quarters below 1, halves to
 * 4, then whole servings. Pure; tested in servings.test.ts.
 */
import { formatNumber } from "../shared/format";
import type { Locale } from "../shared/locales";

export const SERVINGS_STEPS = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10,
] as const;

/** The next step up (+1) or down (−1) from `current`; null past either end. */
export function stepServings(current: number, direction: 1 | -1): number | null {
  if (direction === 1) return SERVINGS_STEPS.find((s) => s > current + 1e-9) ?? null;
  return [...SERVINGS_STEPS].reverse().find((s) => s < current - 1e-9) ?? null;
}

/** "1", "1,5", "0,25": only the decimals the value has. */
export function servingsText(servings: number, locale: Locale): string {
  const decimals = Number.isInteger(servings)
    ? 0
    : Number.isInteger(servings * 2)
      ? 1
      : 2;
  return formatNumber(String(servings), locale, decimals);
}
