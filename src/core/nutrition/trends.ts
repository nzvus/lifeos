/**
 * core/nutrition/trends.ts — the numbers behind the grouped charts on the
 * Targets page: several nutrients side by side per day, on ONE scale.
 *
 * Grams of protein and of fibre are not comparable, so each bar is the
 * day's value as a share of that day's target (1 = on target). A nutrient
 * with no target that day is scaled to its own highest value in the period
 * instead, flagged `relative`, so the bar still shows the shape of the days
 * without pretending there was a target.
 */
import type { NutrientKey } from "./nutrients";

export type GroupedBar = {
  key: NutrientKey;
  value: string | null;
  target: string | null;
  /** value ÷ target, or ÷ the period's max when `relative`; null = not logged. */
  share: number | null;
  relative: boolean;
};

export function groupedBars(
  days: readonly {
    logged: boolean;
    values: Partial<Record<NutrientKey, string>>;
    targets: Partial<Record<NutrientKey, string | null>>;
  }[],
  keys: readonly NutrientKey[],
): GroupedBar[][] {
  const maxOf = Object.fromEntries(
    keys.map((k) => [
      k,
      Math.max(0, ...days.filter((d) => d.logged).map((d) => Number(d.values[k] ?? 0))),
    ]),
  ) as Record<NutrientKey, number>;
  return days.map((d) =>
    keys.map((key) => {
      const value = d.logged ? (d.values[key] ?? "0") : null;
      const target = d.targets[key] ?? null;
      const relative = target === null || Number(target) <= 0;
      const base = relative ? maxOf[key] : Number(target);
      return {
        key,
        value,
        target,
        share: value === null ? null : base > 0 ? Number(value) / base : 0,
        relative,
      };
    }),
  );
}
