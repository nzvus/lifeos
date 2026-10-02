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
import { stripValues } from "@/core/nutrition/display";
import type { UsageMap } from "@/core/nutrition/repositories/usage";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, macroLabels, type Messages } from "@/i18n";
import { ListItem } from "@/ui/ListItem";
import { MacroStrip, mainMacros } from "@/ui/MacroStrip";
import { ListToolbar } from "@/ui/ListToolbar";
import { SortNote } from "@/ui/SortNote";
import { TrashMenu } from "@/ui/TrashMenu";
import { useListControls } from "@/ui/useListControls";
import { CARD } from "@/ui/Card";

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
  /** ADR-0012 */
  nova: number | null;
  origin: string | null;
  fiberTypes: string[];
  tags: { name: string; icon: string }[];
};

type Props = {
  ingredients: IngredientRow[];
  usage: UsageMap;
  locale: Locale;
  /** The sort the list opens with (preferences). */
  initialSort: { sort: SortKey; per: Per };
  t: Pick<
    Messages,
    "ingredients" | "nutrients" | "search" | "macro" | "quality" | "actions"
  >;
  /** The row's "⋯ → Delete" and its Undo (ADR-0015): server actions. */
  trash: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
};

export function IngredientBrowser({
  ingredients,
  usage,
  locale,
  initialSort,
  t,
  trash,
  restore,
}: Props) {
  const list = useListControls<SortKey, Per>({
    sort: initialSort.sort,
    direction: sortChoices().find((c) => c.value === initialSort.sort)!.natural,
    per: initialSort.per,
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
          // Tags are searchable too: "lidl" finds everything tagged Lidl.
          text: `${r.name} ${r.description} ${r.tags.map((t) => t.name).join(" ")}`,
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

  const labels = macroLabels(t);
  return (
    // The search, the order and the list share one card (S20 audit: nothing floats).
    <div className={CARD}>
      <ListToolbar
        sheetId="sort-ingredients"
        {...list.toolbar}
        choices={sortChoices()}
        perChoices={PER}
        shown={shown.length}
        total={rows.length}
        t={t.search}
      />

      {/* Compact rows (design review S4, the convention of Cronometer and
          Yazio): name, energy, one line of macros; price, NOVA and the rest
          on the ingredient's page — or here as the sort's value. */}
      <ul className="grid grid-cols-1 gap-x-8 @3xl:grid-cols-2">
        {shown.map((r) => (
          <ListItem
            key={r.id}
            href={`/ingredients/${r.id}`}
            title={r.name}
            action={
              <TrashMenu
                id={r.id}
                name={r.name}
                trash={trash}
                restore={restore}
                labels={t.actions}
              />
            }
            aside={`${formatNumber(r.kcal, locale, 0)} ${NUTRIENT_UNIT.kcal} ${fill(t.ingredients.per100Short, { unit: r.unit })}`}
            footer={
              r.uses > 0 ? fill(t.search.uses, { n: String(r.uses) }) : t.search.neverUsed
            }
          >
            <MacroStrip
              values={mainMacros(stripValues(r, locale, 1))}
              labels={labels}
              withEnergy={false}
            />
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
