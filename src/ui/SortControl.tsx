/**
 * ui/SortControl.tsx — "sort by X" plus a direction toggle (↑ ascending /
 * ↓ descending). Each sort option carries its NATURAL direction (proteins:
 * highest first; price: cheapest first); choosing a sort resets to it, and
 * the arrow button flips it. The button's label says which way it sorts now,
 * for screen readers and on hover.
 */
"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

export type SortDirection = "asc" | "desc";
export type SortOption<S extends string> = {
  value: S;
  label: string;
  natural: SortDirection;
};

type Props<S extends string> = {
  options: readonly SortOption<S>[];
  sort: S;
  direction: SortDirection;
  onChange: (sort: S, direction: SortDirection) => void;
  labels: { sortBy: string; asc: string; desc: string };
};

export function SortControl<S extends string>({
  options,
  sort,
  direction,
  onChange,
  labels,
}: Props<S>) {
  const Icon = direction === "asc" ? ArrowUp : ArrowDown;
  const current = direction === "asc" ? labels.asc : labels.desc;
  return (
    <div className="flex items-end gap-2">
      <label className="flex flex-1 flex-col gap-1 sm:w-56 sm:flex-none">
        <span className="text-meta font-semibold">{labels.sortBy}</span>
        <select
          value={sort}
          onChange={(e) => {
            const next = options.find((o) => o.value === e.target.value)!;
            onChange(next.value, next.natural); // new sort: its natural direction
          }}
          className="rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 text-body"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => onChange(sort, direction === "asc" ? "desc" : "asc")}
        aria-label={current}
        title={current}
        className="flex h-10 w-10 items-center justify-center rounded-control rule-medium border-ink bg-sheet hover:bg-paper"
      >
        <Icon size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
