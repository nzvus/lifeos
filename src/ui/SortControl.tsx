/**
 * ui/SortControl.tsx — "sort by X" plus a direction toggle (↑ ascending /
 * ↓ descending). Each sort option carries its NATURAL direction (proteins:
 * highest first; price: cheapest first); choosing a sort resets to it, and
 * the arrow button flips it. The button's label says which way it sorts now,
 * for screen readers and on hover. An optional second select says what the
 * value is taken relative to ("protein per 100 kcal").
 */
"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { buttonClass } from "./button";

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
  /** Optional "relative to" choice (e.g. per 100 kcal, per €). */
  per?: {
    label: string;
    options: readonly { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    /** e.g. while sorting by name, where "per" means nothing. */
    disabled?: boolean;
  };
};

export function SortControl<S extends string>({
  options,
  sort,
  direction,
  onChange,
  labels,
  per,
}: Props<S>) {
  const Icon = direction === "asc" ? ArrowUp : ArrowDown;
  const current = direction === "asc" ? labels.asc : labels.desc;
  return (
    <div className="flex flex-wrap items-end gap-2">
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
      {per && (
        <label className="flex flex-1 flex-col gap-1 sm:w-44 sm:flex-none">
          <span className="text-meta font-semibold">{per.label}</span>
          <select
            value={per.value}
            disabled={per.disabled}
            onChange={(e) => per.onChange(e.target.value)}
            className="rounded-control rule-b-medium border-ink bg-sheet px-2 py-2 text-body disabled:opacity-50"
          >
            {per.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        onClick={() => onChange(sort, direction === "asc" ? "desc" : "asc")}
        aria-label={current}
        title={current}
        className={buttonClass({ variant: "secondary", iconOnly: true })}
      >
        <Icon size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
