/**
 * features/nutrition/ingredients/IngredientBrowser.tsx — the ingredient list
 * with instant search and smart ordering.
 *
 * Client component: search and sort happen in the browser on every
 * keystroke, with no server round trip (hundreds of rows sort in well under
 * a millisecond). The server page passes the rows once plus usage counts.
 *
 * - Search and sort: core/shared/browse.ts (the same rules as every list;
 *   name and notes are searched), toolbar: ui/ListToolbar.
 * - Derived columns come from core/nutrition/insights.ts: protein per
 *   100 kcal ("how much protein for the energy") and price per kg/l.
 * - Layout: cards on phones, a table from the md breakpoint up. Both are in
 *   the HTML; CSS shows one (simpler than measuring the screen in JS, and
 *   no layout jump on load).
 */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  macroSplit,
  pricePerThousandCents,
  proteinPer100kcal,
} from "@/core/nutrition/insights";
import { stripValues } from "@/core/nutrition/display";
import type { UsageMap } from "@/core/nutrition/repositories/usage";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { browse } from "@/core/shared/browse";
import { fill, macroLabels, type Messages } from "@/i18n";
import { MacroBar } from "@/ui/MacroBar";
import { ListItem } from "@/ui/ListItem";
import { MacroStrip } from "@/ui/MacroStrip";
import { ListToolbar } from "@/ui/ListToolbar";
import type { SortDirection } from "@/ui/SortControl";

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

  const shown = useMemo(
    () =>
      browse(rows, {
        query,
        describe: (r) => ({
          text: `${r.name} ${r.description}`,
          name: r.name,
          uses: r.uses,
          lastUsed: r.lastUsed,
        }),
        sort,
        direction,
        values: {
          protein: (r) => Number(r.protein),
          density: (r) => (r.density === null ? null : Number(r.density)),
          kcal: (r) => Number(r.kcal),
          fiber: (r) => Number(r.fiber),
          price: (r) => r.perKg,
        },
        locale,
      }),
    [rows, query, sort, direction, locale],
  );

  const n = (v: string) => formatNumber(v, locale, 1);

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        query={query}
        onQuery={setQuery}
        sorts={SORTS.map((o) => ({
          value: o.key,
          label: t.search.sorts[o.key],
          natural: o.natural,
        }))}
        sort={sort}
        direction={direction}
        onSort={(nextSort, nextDirection) => {
          setSort(nextSort);
          setDirection(nextDirection);
        }}
        count={
          shown.length === 0 && query
            ? fill(t.search.noResults, { q: query })
            : fill(t.search.count, {
                n: String(shown.length),
                total: String(rows.length),
              })
        }
        labels={{
          search: t.search.placeholder,
          sortBy: t.search.sortBy,
          asc: t.search.asc,
          desc: t.search.desc,
        }}
      />

      {/* Phones: cards. */}
      <ul className="flex flex-col md:hidden">
        {shown.map((r) => (
          <ListItem
            key={r.id}
            title={
              <Link
                href={`/ingredients/${r.id}`}
                className="underline-offset-4 hover:underline"
              >
                {r.name}
              </Link>
            }
            aside={
              r.perKg === null
                ? undefined
                : `${formatCents(r.perKg, locale)} ${t.macro.perKg}`
            }
            footer={[
              fill(t.ingredients.per100Short, { unit: r.unit }),
              r.density && `${n(r.density)} ${t.macro.density}`,
              r.uses > 0 && fill(t.search.uses, { n: String(r.uses) }),
            ]
              .filter(Boolean)
              .join(" · ")}
          >
            <MacroStrip values={stripValues(r, locale, 1)} labels={macroLabels(t)} />
          </ListItem>
        ))}
      </ul>

      {/* Tablets and desktops: a real table, horizontally scrollable if needed. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="rule-b-heavy border-ink font-display text-meta">
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
                  <span className="pl-1 text-meta text-muted">
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
