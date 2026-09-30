/**
 * core/shared/browse.ts — what every browsable list does with a query and a
 * sort: match and rank (./search.ts), then order.
 *
 *   "used"  rank's own order: relevance while typing, else most used;
 *           ascending = the same list reversed
 *   "name"  alphabetical in the user's locale
 *   other   by the value the caller gives for that sort, missing values
 *           always last (./sorting.ts)
 *
 * Pure; the ingredient and meal browsers only say how to describe a row and
 * which value each sort reads.
 */
import { rank, type Rankable } from "./search";
import { reverseIf, sortByValue, type Direction } from "./sorting";

export type BrowseOptions<T, S extends string> = {
  query: string;
  describe: (row: T) => Rankable;
  // NoInfer: the sort keys come from `values`, not from the current sort.
  sort: NoInfer<S> | "used" | "name";
  direction: Direction;
  /** The value each extra sort reads; null = missing (sorted last). */
  values: Record<S, (row: T) => number | string | null>;
  locale: string;
};

export function browse<T, S extends string>(
  rows: readonly T[],
  { query, describe, sort, direction, values, locale }: BrowseOptions<T, S>,
): T[] {
  const matched = rank(rows, query, describe);
  if (sort === "used") return reverseIf(matched, direction === "asc");
  if (sort === "name")
    return sortByValue(matched, (r) => describe(r).name, direction, locale);
  return sortByValue(matched, values[sort as S], direction, locale);
}
