/**
 * ui/ListToolbar.tsx — the top of every browsable list: a search box, the
 * sort control and the "N of M" count (announced to screen readers). The
 * matching and ordering themselves are core/shared/browse.ts.
 */
"use client";

import { Search } from "lucide-react";
import { SortControl, type SortDirection, type SortOption } from "./SortControl";

type Props<S extends string> = {
  query: string;
  onQuery: (query: string) => void;
  sorts: readonly SortOption<S>[];
  sort: S;
  direction: SortDirection;
  onSort: (sort: S, direction: SortDirection) => void;
  /** Already filled in: "12 of 52", or "No results for …". */
  count: string;
  labels: { search: string; sortBy: string; asc: string; desc: string };
};

export function ListToolbar<S extends string>({
  query,
  onQuery,
  sorts,
  sort,
  direction,
  onSort,
  count,
  labels,
}: Props<S>) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search grows, sort stays compact; stacks on narrow phones. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="relative flex flex-1 flex-col gap-1">
          <span className="sr-only">{labels.search}</span>
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2.5 left-2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={labels.search}
            className="w-full rounded-control rule-b-medium border-ink bg-sheet py-2 pr-2 pl-8 text-body outline-none focus-visible:border-focus"
          />
        </label>
        <SortControl
          options={sorts}
          sort={sort}
          direction={direction}
          onChange={onSort}
          labels={{ sortBy: labels.sortBy, asc: labels.asc, desc: labels.desc }}
        />
      </div>
      <p className="text-meta text-muted" aria-live="polite">
        {count}
      </p>
    </div>
  );
}
