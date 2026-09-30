/**
 * features/nutrition/meals/MealBrowser.tsx — meals with instant search and
 * smart ordering. Same principles as IngredientBrowser (see its header):
 * core/shared/browse.ts + ui/ListToolbar, "most used" first by default,
 * totals always computed by core (the UI never sums). Each card has the same
 * details disclosure as a logged entry (ui/FoodDetails).
 *
 * Each card shows per-serving energy and macros, the energy split bar,
 * protein per 100 kcal, cost, and usage. Phones: one column; desktops: two.
 */
"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  browseFoods,
  PER,
  sortChoices,
  sortNote,
  type Per,
  type SortKey,
} from "@/core/nutrition/metrics";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { detailLines, macroBars } from "@/core/nutrition/display";
import type { MealWithLines } from "@/core/nutrition/repositories/meals";
import type { UsageMap } from "@/core/nutrition/repositories/usage";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, macroLabels, type Messages } from "@/i18n";
import { FoodDetails } from "@/ui/FoodDetails";
import { FoodCardMeta } from "@/ui/FoodCardMeta";
import { ListItem } from "@/ui/ListItem";
import { MacroBars } from "@/ui/MacroBars";
import { ListToolbar } from "@/ui/ListToolbar";
import { SortNote } from "@/ui/SortNote";
import { useListControls } from "@/ui/useListControls";

type Props = {
  meals: MealWithLines[];
  usage: UsageMap;
  locale: Locale;
  t: Pick<Messages, "meals" | "nutrients" | "search" | "macro" | "label" | "macroShort">;
};

export function MealBrowser({ meals, usage, locale, t }: Props) {
  const list = useListControls<SortKey, Per>({
    sort: "used",
    direction: "desc",
    per: "none",
    plainSorts: ["used", "name"],
  });

  const rows = useMemo(
    () =>
      meals.map((m) => ({
        ...m,
        // Per serving, cost included (only when every price is known).
        metrics: {
          nutrients: m.totals.nutrients,
          costCents: m.totals.costComplete ? m.totals.costCents : null,
        },
        uses: usage[m.id]?.uses ?? 0,
        lastUsed: usage[m.id]?.lastUsed ?? null,
        // Ingredient names are searchable too: "skyr" finds every meal with skyr.
        searchText: `${m.name} ${m.notes} ${m.lines.map((l) => l.ingredientName).join(" ")}`,
      })),
    [meals, usage],
  );

  const shown = useMemo(
    () =>
      browseFoods(rows, {
        query: list.query,
        describe: (r) => ({
          text: r.searchText,
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

  if (meals.length === 0) return <p className="text-muted">{t.meals.empty}</p>;
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

      <ul className="grid gap-x-8 md:grid-cols-2">
        {shown.map((m) => {
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
                <span className="inline-flex items-center gap-1">
                  <Tag size={14} aria-hidden="true" />
                  {m.totals.costComplete
                    ? formatCents(m.totals.costCents, locale)
                    : fill(t.label.costPartialShort, {
                        v: formatCents(m.totals.costCents, locale),
                      })}
                </span>
              }
            >
              <FoodCardMeta
                energy={`${formatNumber(m.totals.nutrients.kcal, locale, 0)} ${NUTRIENT_UNIT.kcal}`}
                basis={t.meals.perServing}
                uses={
                  m.uses > 0
                    ? fill(t.search.uses, { n: String(m.uses) })
                    : t.search.neverUsed
                }
              />
              <MacroBars
                rows={macroBars(m.totals.nutrients, locale)}
                labels={t.macroShort}
                unit="g"
              />
              <SortNote
                value={sortNote(m.metrics, list.sort, list.per, locale)}
                sort={list.sort}
                per={list.per}
                t={t.search}
              />
              {/* The same details as a logged entry: one serving's lines. */}
              <FoodDetails
                summary={fill(t.macro.ingredientsCount, { n: String(m.lines.length) })}
                lines={detailLines(
                  m.lines.map((l) => ({ ...l, name: l.ingredientName })),
                  "1",
                  locale,
                )}
                labels={labels}
              />
            </ListItem>
          );
        })}
      </ul>
    </div>
  );
}
