/**
 * ui/ListToolbar.tsx — the top of the food lists: a search box and, beside
 * it, a button with the current sort that opens "sort by", "relative to"
 * and the direction (ui/SortControl) in a sheet (2026-10-02: they took half
 * a phone screen above the list); then the "N of M" count (announced to
 * screen readers). Labels come from the `search`
 * dictionary; which sorts exist and their natural direction from the caller
 * (core/nutrition/metrics.ts sortChoices). Matching and ordering are core's
 * (browseFoods).
 */
"use client";

import { ArrowDownUp, Search } from "lucide-react";
import { fill, type Messages } from "@/i18n";
import { Sheet } from "./Sheet";
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
  /** Unique on the page: the sort sheet's #id. */
  sheetId: string;
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
  sheetId,
  t,
}: Props<S, P>) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <label className="relative flex min-w-0 flex-1 flex-col gap-1">
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
        <a
          href={`#${sheetId}`}
          aria-label={fill(t.sortButton, { sort: t.sorts[sort] })}
          className="tile inline-flex shrink-0 items-center gap-1.5 rounded-control px-3 py-2 text-meta font-semibold"
        >
          <ArrowDownUp size={16} aria-hidden="true" />
          <span className="max-w-28 truncate">{t.sorts[sort]}</span>
        </a>
      </div>
      <Sheet
        id={sheetId}
        title={t.sortTitle}
        icon={<ArrowDownUp size={20} aria-hidden="true" />}
        closeLabel={t.close}
      >
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
      </Sheet>
      <p className="text-meta text-muted" aria-live="polite">
        {shown === 0 && query
          ? fill(t.noResults, { q: query })
          : fill(t.count, { n: String(shown), total: String(total) })}
      </p>
    </div>
  );
}
