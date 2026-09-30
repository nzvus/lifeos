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
import { useMemo } from "react";
import { pricePerThousandCents } from "@/core/nutrition/insights";
import {
  browseFoods,
  PER,
  sortChoices,
  sortNote,
  type Per,
  type SortKey,
} from "@/core/nutrition/metrics";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { macroBars } from "@/core/nutrition/display";
import type { UsageMap } from "@/core/nutrition/repositories/usage";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { FoodCardMeta } from "@/ui/FoodCardMeta";
import { ListItem } from "@/ui/ListItem";
import { MacroBars } from "@/ui/MacroBars";
import { ListToolbar } from "@/ui/ListToolbar";
import { SortNote } from "@/ui/SortNote";
import { useListControls } from "@/ui/useListControls";

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
  salt: string;
  packagePriceCents: number | null;
  packageSize: string | null;
};

type Props = {
  ingredients: IngredientRow[];
  usage: UsageMap;
  locale: Locale;
  t: Pick<Messages, "ingredients" | "nutrients" | "search" | "macro" | "macroShort">;
};

export function IngredientBrowser({ ingredients, usage, locale, t }: Props) {
  const list = useListControls<SortKey, Per>({
    sort: "used",
    direction: "desc",
    per: "none",
    plainSorts: ["used", "name"],
  });

  // Derived values computed once per row, not on every keystroke.
  const rows = useMemo(
    () =>
      ingredients.map((i) => {
        const perKg = pricePerThousandCents(i);
        return {
          ...i,
          perKg,
          // Everything per 100 g/ml, cost included (per kg / 10).
          metrics: {
            nutrients: {
              kcal: i.kcal,
              protein: i.protein,
              carbs: i.carbs,
              sugars: i.sugars,
              fat: i.fat,
              saturatedFat: i.saturatedFat,
              fiber: i.fiber,
              salt: i.salt,
            },
            costCents: perKg === null ? null : perKg / 10,
          },
          uses: usage[i.id]?.uses ?? 0,
          lastUsed: usage[i.id]?.lastUsed ?? null,
        };
      }),
    [ingredients, usage],
  );

  const shown = useMemo(
    () =>
      browseFoods(rows, {
        query: list.query,
        describe: (r) => ({
          text: `${r.name} ${r.description}`,
          name: r.name,
          uses: r.uses,
          lastUsed: r.lastUsed,
        }),
        metricRow: (r) => r.metrics,
        sort: list.sort,
        per: list.per,
        direction: list.direction,
        locale,
      }),
    [rows, list.query, list.sort, list.per, list.direction, locale],
  );

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        {...list.toolbar}
        choices={sortChoices()}
        perChoices={PER}
        shown={shown.length}
        total={rows.length}
        t={t.search}
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
            <SortNote
              value={sortNote(r.metrics, list.sort, list.per, locale)}
              sort={list.sort}
              per={list.per}
              t={t.search}
            />
          </ListItem>
        ))}
      </ul>
    </div>
  );
}
