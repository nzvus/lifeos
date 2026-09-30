/**
 * core/shared/sorting.ts — sorting by a value in a chosen direction, with
 * one rule the UI relies on: MISSING values (no price, no target, 0 kcal
 * density) always go LAST, whichever the direction. Otherwise "cheapest
 * first" would start with every ingredient that has no price.
 *
 * Pure; used by the ingredient and meal browsers. Tested in sorting.test.ts.
 */

export type Direction = "asc" | "desc";

/** A copy of `items` sorted by `value` (numbers or strings), nulls last. */
export function sortByValue<T>(
  items: readonly T[],
  value: (item: T) => number | string | null,
  direction: Direction,
  locale = "it",
): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    if (x === null) return y === null ? 0 : 1; // missing: always last
    if (y === null) return -1;
    const cmp =
      typeof x === "string" && typeof y === "string"
        ? x.localeCompare(y, locale)
        : Number(x) - Number(y);
    return cmp * sign;
  });
}

/** Reverses a list's order (for "relevance, reversed"). */
export function reverseIf<T>(items: T[], reverse: boolean): T[] {
  return reverse ? [...items].reverse() : items;
}
