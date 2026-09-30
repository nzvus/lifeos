/**
 * features/nutrition/ingredients/IngredientBrowser.tsx — the ingredient list
 * with instant search and smart ordering.
 *
 * Client component: search and sort happen in the browser on every
 * keystroke, with no server round trip (hundreds of rows sort in well under
 * a millisecond). The server page passes the rows once plus usage counts.
 *
 * - Search: core/shared/search.ts (case/accent-insensitive, every word must
 *   match, name and notes are searched).
 * - Sort "Most used" = relevance while typing, else usage (the default:
 *   what you eat is on top). Other sorts filter first, then order by value.
 * - Derived columns come from core/nutrition/insights.ts: protein per
 *   100 kcal ("how much protein for the energy") and price per kg/l.
 * - Layout: cards on phones, a table from the md breakpoint up. Both are in
 *   the HTML; CSS shows one (simpler than measuring the screen in JS, and
 *   no layout jump on load).
 */
"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  macroSplit,
  pricePerThousandCents,
  proteinPer100kcal,
} from "@/core/nutrition/insights";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { UsageMap } from "@/core/nutrition/repositories/usage";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { rank } from "@/core/shared/search";
import { reverseIf, sortByValue } from "@/core/shared/sorting";
import { fill, type Messages } from "@/i18n";
import { MacroBar } from "@/ui/MacroBar";
import { MacroStrip } from "@/ui/MacroStrip";
import { SortControl, type SortDirection } from "@/ui/SortControl";

/** The fields this view needs (a subset of an ingredient row). */
export type IngredientRow = {
  id: string;
  name: string;
  description: string;
  unit: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  packagePriceCents: number | null;
  packageSize: string | null;
};

/** Sorts and their natural direction (the arrow button reverses it). */
const SORTS = [
  { key: "used", natural: "desc" },
  { key: "name", natural: "asc" },
  { key: "protein", natural: "desc" },
  { key: "density", natural: "desc" },
  { key: "kcal", natural: "asc" },
  { key: "fiber", natural: "desc" },
  { key: "price", natural: "asc" },
] as const satisfies readonly { key: string; natural: SortDirection }[];
type Sort = (typeof SORTS)[number]["key"];

type Props = {
  ingredients: IngredientRow[];
  usage: UsageMap;
  locale: Locale;
  t: Pick<Messages, "ingredients" | "nutrients" | "search" | "macro" | "glance">;
};

export function IngredientBrowser({ ingredients, usage, locale, t }: Props) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("used");
  const [direction, setDirection] = useState<SortDirection>("desc");

  // Derived numbers computed once per row, not on every keystroke.
  const rows = useMemo(
    () =>
      ingredients.map((i) => ({
        ...i,
        density: proteinPer100kcal(i),
        split: macroSplit(i),
        perKg: pricePerThousandCents(i),
        uses: usage[i.id]?.uses ?? 0,
        lastUsed: usage[i.id]?.lastUsed ?? null,
      })),
    [ingredients, usage],
  );

  const shown = useMemo(() => {
    const matched = rank(rows, query, (r) => ({
      text: `${r.name} ${r.description}`,
      name: r.name,
      uses: r.uses,
      lastUsed: r.lastUsed,
    }));
    // "Use": rank's own order (relevance while typing, else most used);
    // ascending = the same list reversed. Other sorts: by value, with
    // missing values (no price, 0 kcal) always last (core/shared/sorting.ts).
    if (sort === "used") return reverseIf(matched, direction === "asc");
    if (sort === "name") return sortByValue(matched, (r) => r.name, direction, locale);
    const value: Record<
      Exclude<Sort, "used" | "name">,
      (r: (typeof rows)[number]) => number | null
    > = {
      protein: (r) => Number(r.protein),
      density: (r) => (r.density === null ? null : Number(r.density)),
      kcal: (r) => Number(r.kcal),
      fiber: (r) => Number(r.fiber),
      price: (r) => r.perKg,
    };
    return sortByValue(matched, value[sort], direction, locale);
  }, [rows, query, sort, direction, locale]);

  const n = (v: string) => formatNumber(v, locale, 1);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: search grows, sort stays compact; stacks on narrow phones. */}
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
            className="w-full border-b-2 border-ink bg-sheet py-2 pr-2 pl-8 text-base outline-none focus-visible:border-focus"
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

      {/* Phones: cards. */}
      <ul className="flex flex-col md:hidden">
        {shown.map((r) => (
          <li key={r.id} className="border-b border-hairline py-2">
            <Link
              href={`/ingredients/${r.id}`}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="font-semibold">{r.name}</span>
              <span className="font-display text-sm text-muted tabular-nums">
                {r.perKg === null
                  ? ""
                  : `${formatCents(r.perKg, locale)} ${t.macro.perKg}`}
              </span>
            </Link>
            <MacroStrip
              energy={`${n(r.kcal)} ${NUTRIENT_UNIT.kcal}`}
              protein={n(r.protein)}
              carbs={n(r.carbs)}
              fat={n(r.fat)}
              fiber={n(r.fiber)}
              split={r.split}
              labels={{
                protein: t.nutrients.protein,
                carbs: t.nutrients.carbs,
                fat: t.nutrients.fat,
                fiber: t.nutrients.fiber,
                split: t.macro.splitTitle,
              }}
            />
            <p className="text-xs text-muted">
              {[
                fill(t.ingredients.per100Short, { unit: r.unit }),
                r.density && `${n(r.density)} ${t.macro.density}`,
                r.uses > 0 && fill(t.search.uses, { n: String(r.uses) }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      {/* Tablets and desktops: a real table, horizontally scrollable if needed. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-6 border-ink font-display text-sm">
              <th className="py-2 pr-3">{t.ingredients.name}</th>
              {(["kcal", "protein", "carbs", "fat", "fiber"] as const).map((k) => (
                <th key={k} className="px-2 py-2 text-right">
                  {t.nutrients[k]}
                </th>
              ))}
              <th className="w-28 px-2 py-2">{t.glance.ingredientMix}</th>
              <th className="px-2 py-2 text-right">{t.macro.density}</th>
              <th className="px-2 py-2 text-right">{t.ingredients.pricePerThousand}</th>
              <th className="py-2 pl-2 text-right">{t.search.sorts.used}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-hairline hover:bg-sheet">
                <td className="py-2 pr-3">
                  <Link
                    href={`/ingredients/${r.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {r.name}
                  </Link>
                  <span className="pl-1 text-sm text-muted">
                    {fill(t.ingredients.per100Short, { unit: r.unit })}
                  </span>
                </td>
                {([r.kcal, r.protein, r.carbs, r.fat, r.fiber] as const).map((v, idx) => (
                  <td
                    key={idx}
                    className="px-2 py-2 text-right font-display tabular-nums"
                  >
                    {n(v)}
                  </td>
                ))}
                <td className="px-2 py-2 align-middle">
                  {r.split && <MacroBar {...r.split} label={t.macro.splitTitle} />}
                </td>
                <td className="px-2 py-2 text-right font-display tabular-nums">
                  {r.density === null ? "—" : n(r.density)}
                </td>
                <td className="px-2 py-2 text-right font-display tabular-nums">
                  {r.perKg === null ? "—" : formatCents(r.perKg, locale)}
                </td>
                <td className="py-2 pl-2 text-right font-display text-muted tabular-nums">
                  {r.uses || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
