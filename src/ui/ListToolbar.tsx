/**
 * ui/ListToolbar.tsx — the top of the food lists: a search box, "sort by"
 * with "relative to" (ui/SortControl), the direction, and the "N of M"
 * count (announced to screen readers). Labels come from the `search`
 * dictionary; which sorts exist and their natural direction from the caller
 * (core/nutrition/metrics.ts sortChoices). Matching and ordering are core's
 * (browseFoods).
 */
"use client";

import { Search } from "lucide-react";
import { fill, type Messages } from "@/i18n";
import { SortControl, type SortDirection } from "./SortControl";

type Props<S extends string, P extends string> = {
  query: string;
  onQuery: (query: string) => void;
  choices: readonly { value: S; natural: SortDirection }[];
  sort: S;
  direction: SortDirection;
  onSort: (sort: S, direction: SortDirection) => void;
  perChoices: readonly P[];
  per: P;
  onPer: (per: P) => void;
  /** "Relative to" means nothing for these sorts (usage, name). */
  perDisabled: boolean;
  shown: number;
  total: number;
  t: Messages["search"];
};

export function ListToolbar<
  S extends keyof Messages["search"]["sorts"],
  P extends keyof Messages["search"]["per"],
>({
  query,
  onQuery,
  choices,
  sort,
  direction,
  onSort,
  perChoices,
  per,
  onPer,
  perDisabled,
  shown,
  total,
  t,
}: Props<S, P>) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search grows, sort stays compact; stacks on narrow phones. */}
      <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-end">
        <label className="relative flex flex-1 flex-col gap-1">
          <span className="sr-only">{t.placeholder}</span>
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2.5 left-2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={t.placeholder}
            className="w-full rounded-control rule-b-medium border-ink bg-sheet py-2 pr-2 pl-8 text-body outline-none focus-visible:border-focus"
          />
        </label>
        <SortControl
          options={choices.map((c) => ({ ...c, label: t.sorts[c.value] }))}
          sort={sort}
          direction={direction}
          onChange={onSort}
          labels={{ sortBy: t.sortBy, asc: t.asc, desc: t.desc }}
          per={{
            label: t.perLabel,
            options: perChoices.map((p) => ({ value: p, label: t.per[p] })),
            value: per,
            onChange: (v) => onPer(v as P),
            disabled: perDisabled,
          }}
        />
      </div>
      <p className="text-meta text-muted" aria-live="polite">
        {shown === 0 && query
          ? fill(t.noResults, { q: query })
          : fill(t.count, { n: String(shown), total: String(total) })}
      </p>
    </div>
  );
}
