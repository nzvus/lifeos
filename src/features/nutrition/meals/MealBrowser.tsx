/**
 * features/nutrition/meals/MealBrowser.tsx — meals with instant search and
 * smart ordering. Same principles as IngredientBrowser (see its header):
 * search in the browser via core/shared/search.ts, "most used" first by
 * default, totals always computed by core (the UI never sums).
 *
 * Each card shows per-serving energy and macros, the energy split bar,
 * protein per 100 kcal, cost, and usage. Phones: one column; desktops: two.
 */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { macroSplit, proteinPer100kcal } from "@/core/nutrition/insights";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { MealWithLines } from "@/core/nutrition/repositories/meals";
import type { UsageMap } from "@/core/nutrition/repositories/usage";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { rank } from "@/core/shared/search";
import { fill, type Messages } from "@/i18n";
import { MacroBar } from "@/ui/MacroBar";

const SORTS = ["used", "name", "protein", "density", "kcalLow", "costLow"] as const;
type Sort = (typeof SORTS)[number];

type Props = {
  meals: MealWithLines[];
  usage: UsageMap;
  locale: Locale;
  t: Pick<Messages, "meals" | "nutrients" | "search" | "macro" | "label">;
};

export function MealBrowser({ meals, usage, locale, t }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("used");

  const rows = useMemo(
    () =>
      meals.map((m) => ({
        ...m,
        density: proteinPer100kcal(m.totals.nutrients),
        split: macroSplit(m.totals.nutrients),
        uses: usage[m.id]?.uses ?? 0,
        lastUsed: usage[m.id]?.lastUsed ?? null,
        // Ingredient names are searchable too: "skyr" finds every meal with skyr.
        searchText: `${m.name} ${m.notes} ${m.lines.map((l) => l.ingredientName).join(" ")}`,
      })),
    [meals, usage],
  );

  const shown = useMemo(() => {
    const matched = rank(rows, query, (r) => ({
      text: r.searchText,
      name: r.name,
      uses: r.uses,
      lastUsed: r.lastUsed,
    }));
    const num = (s: string | null) => (s === null ? -Infinity : Number(s));
    switch (sort) {
      case "used":
        return matched;
      case "name":
        return [...matched].sort((a, b) => a.name.localeCompare(b.name, locale));
      case "protein":
        return [...matched].sort(
          (a, b) => num(b.totals.nutrients.protein) - num(a.totals.nutrients.protein),
        );
      case "density":
        return [...matched].sort((a, b) => num(b.density) - num(a.density));
      case "kcalLow":
        return [...matched].sort(
          (a, b) => num(a.totals.nutrients.kcal) - num(b.totals.nutrients.kcal),
        );
      case "costLow":
        return [...matched].sort((a, b) => a.totals.costCents - b.totals.costCents);
    }
  }, [rows, query, sort, locale]);

  const n = (v: string) => formatNumber(v, locale, 1);

  if (meals.length === 0) return <p className="text-muted">{t.meals.empty}</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1">
          <span className="sr-only">{t.search.placeholder}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search.placeholder}
            className="w-full border-b-2 border-ink bg-sheet px-2 py-2 text-base outline-none focus-visible:border-focus"
          />
        </label>
        <label className="flex flex-col gap-1 sm:w-64">
          <span className="text-sm font-semibold">{t.search.sortBy}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="border-b-2 border-ink bg-sheet px-2 py-2 text-base"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t.search.sorts[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        {shown.length === 0 && query
          ? fill(t.search.noResults, { q: query })
          : fill(t.search.count, { n: String(shown.length), total: String(rows.length) })}
      </p>

      <ul className="grid gap-x-8 md:grid-cols-2">
        {shown.map((m) => {
          const tn = m.totals.nutrients;
          return (
            <li key={m.id} className="flex flex-col gap-1 border-b-2 border-ink py-3">
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/meals/${m.id}`}
                  className="font-display text-xl font-bold underline-offset-4 hover:underline"
                >
                  {m.name}
                </Link>
                <span className="font-display text-lg tabular-nums">{`${n(tn.kcal)} ${NUTRIENT_UNIT.kcal}`}</span>
              </div>
              {m.split && <MacroBar {...m.split} label={t.macro.splitTitle} />}
              <p className="font-display text-sm tabular-nums">
                {`${t.macro.protein} ${n(tn.protein)} · ${t.macro.carbs} ${n(tn.carbs)} · ${t.macro.fat} ${n(tn.fat)} · ${t.nutrients.fiber} ${n(tn.fiber)}`}
              </p>
              <p className="text-sm text-muted tabular-nums">
                {[
                  t.meals.perServing,
                  m.density && `${n(m.density)} ${t.macro.density}`,
                  m.totals.costComplete
                    ? formatCents(m.totals.costCents, locale)
                    : fill(t.label.costPartialShort, {
                        v: formatCents(m.totals.costCents, locale),
                      }),
                  m.uses > 0 && fill(t.search.uses, { n: String(m.uses) }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
