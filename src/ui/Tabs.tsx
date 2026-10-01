/**
 * ui/Tabs.tsx — a row of tabs over one panel ("Add training": Routine /
 * Exercise / Estimate), the look of the day page's "Add to day". WAI-ARIA
 * tabs: role="tablist", aria-selected, the panel labelled by its tab.
 */
"use client";

import type { ReactNode } from "react";

export type Tab<K extends string> = { key: K; label: string; icon?: ReactNode };

export function Tabs<K extends string>({
  id,
  label,
  tabs,
  selected,
  onSelect,
  children,
}: {
  /** Prefix for the tab and panel ids (unique on the page). */
  id: string;
  label: string;
  tabs: readonly Tab<K>[];
  selected: K;
  onSelect: (key: K) => void;
  children: ReactNode;
}) {
  return (
    <>
      <div role="tablist" aria-label={label} className="flex">
        {tabs.map((tab) => {
          const on = tab.key === selected;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`${id}-tab-${tab.key}`}
              aria-selected={on}
              aria-controls={`${id}-panel`}
              onClick={() => onSelect(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-control px-2 py-2 font-display text-item ${
                on
                  ? "rule-b-heavy border-ink bg-sheet font-bold text-ink"
                  : "rule-b-medium border-hairline text-muted hover:text-ink"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${selected}`}>
        {children}
      </div>
    </>
  );
}
