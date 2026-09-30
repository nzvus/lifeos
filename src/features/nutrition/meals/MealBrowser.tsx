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

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { macroSplit, proteinPer100kcal } from "@/core/nutrition/insights";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { MealWithLines } from "@/core/nutrition/repositories/meals";
import type { UsageMap } from "@/core/nutrition/repositories/usage";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { rank } from "@/core/shared/search";
import { reverseIf, sortByValue } from "@/core/shared/sorting";
import { fill, type Messages } from "@/i18n";
import { ListItem } from "@/ui/ListItem";
import { MacroStrip } from "@/ui/MacroStrip";
import { SortControl, type SortDirection } from "@/ui/SortControl";

/** Sorts and their natural direction (the arrow button reverses it). */
const SORTS = [
  { key: "used", natural: "desc" },
  { key: "name", natural: "asc" },
  { key: "protein", natural: "desc" },
  { key: "density", natural: "desc" },
  { key: "kcal", natural: "asc" },
  { key: "cost", natural: "asc" },
] as const satisfies readonly { key: string; natural: SortDirection }[];
type Sort = (typeof SORTS)[number]["key"];

type Props = {
  meals: MealWithLines[];
  usage: UsageMap;
  locale: Locale;
  t: Pick<Messages, "meals" | "nutrients" | "search" | "macro" | "label">;
};

export function MealBrowser({ meals, usage, locale, t }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("used");
  const [direction, setDirection] = useState<SortDirection>("desc");

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
    // Same rules as the ingredient browser (see core/shared/sorting.ts).
    if (sort === "used") return reverseIf(matched, direction === "asc");
    if (sort === "name") return sortByValue(matched, (m) => m.name, direction, locale);
    const value: Record<
      Exclude<Sort, "used" | "name">,
      (m: (typeof rows)[number]) => number | null
    > = {
      protein: (m) => Number(m.totals.nutrients.protein),
      density: (m) => (m.density === null ? null : Number(m.density)),
      kcal: (m) => Number(m.totals.nutrients.kcal),
      cost: (m) => m.totals.costCents,
    };
    return sortByValue(matched, value[sort], direction, locale);
  }, [rows, query, sort, direction, locale]);

  const n = (v: string) => formatNumber(v, locale, 1);

  if (meals.length === 0) return <p className="text-muted">{t.meals.empty}</p>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="relative flex flex-1 flex-col gap-1">
          <span className="sr-only">{t.search.placeholder}</span>
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2.5 left-2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search.placeholder}
            className="w-full rule-b-medium border-ink bg-sheet py-2 pr-2 pl-8 text-base outline-none focus-visible:border-focus"
          />
        </label>
        <SortControl
          options={SORTS.map((o) => ({
            value: o.key,
            label: t.search.sorts[o.key],
            natural: o.natural,
          }))}
          sort={sort}
          direction={direction}
          onChange={(nextSort, nextDirection) => {
            setSort(nextSort);
            setDirection(nextDirection);
          }}
          labels={{ sortBy: t.search.sortBy, asc: t.search.asc, desc: t.search.desc }}
        />
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
            <ListItem
              key={m.id}
              title={
                <Link
                  href={`/meals/${m.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {m.name}
                </Link>
              }
              aside={
                m.totals.costComplete
                  ? formatCents(m.totals.costCents, locale)
                  : fill(t.label.costPartialShort, {
                      v: formatCents(m.totals.costCents, locale),
                    })
              }
              footer={[
                t.meals.perServing,
                m.density && `${n(m.density)} ${t.macro.density}`,
                m.uses > 0 && fill(t.search.uses, { n: String(m.uses) }),
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              <MacroStrip
                energy={`${formatNumber(tn.kcal, locale, 0)} ${NUTRIENT_UNIT.kcal}`}
                protein={n(tn.protein)}
                carbs={n(tn.carbs)}
                fat={n(tn.fat)}
                fiber={n(tn.fiber)}
                split={m.split}
                labels={{
                  protein: t.nutrients.protein,
                  carbs: t.nutrients.carbs,
                  fat: t.nutrients.fat,
                  fiber: t.nutrients.fiber,
                  split: t.macro.splitTitle,
                }}
              />
            </ListItem>
          );
        })}
      </ul>
    </div>
  );
}
