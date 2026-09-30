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
 * - Layout: the shared row (ui/ListItem) in a grid, like the meals list.
 */
"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { pricePerThousandCents, proteinPer100kcal } from "@/core/nutrition/insights";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { macroBars } from "@/core/nutrition/display";
import type { UsageMap } from "@/core/nutrition/repositories/usage";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { browse } from "@/core/shared/browse";
import { fill, type Messages } from "@/i18n";
import { FoodCardMeta } from "@/ui/FoodCardMeta";
import { ListItem } from "@/ui/ListItem";
import { MacroBars } from "@/ui/MacroBars";
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
  sugars: string;
  fat: string;
  saturatedFat: string;
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
  t: Pick<Messages, "ingredients" | "nutrients" | "search" | "macro" | "macroShort">;
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

      {/* One layout on every screen, the same as the meals list: cards,
          two columns from md up. */}
      <ul className="grid gap-x-8 md:grid-cols-2">
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
              r.perKg === null ? undefined : (
                <span className="inline-flex items-center gap-1">
                  <Tag size={14} aria-hidden="true" />
                  {`${formatCents(r.perKg, locale)} ${t.macro.perKg}`}
                </span>
              )
            }
          >
            <FoodCardMeta
              energy={`${formatNumber(r.kcal, locale, 0)} ${NUTRIENT_UNIT.kcal}`}
              basis={fill(t.ingredients.per100Short, { unit: r.unit })}
              uses={
                r.uses > 0
                  ? fill(t.search.uses, { n: String(r.uses) })
                  : t.search.neverUsed
              }
            />
            <MacroBars rows={macroBars(r, locale)} labels={t.macroShort} unit="g" />
          </ListItem>
        ))}
      </ul>
    </div>
  );
}
