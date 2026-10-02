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
import { useMemo, useState } from "react";
import {
  browseFoods,
  PER,
  sortChoices,
  sortNote,
  type Per,
  type SortKey,
} from "@/core/nutrition/metrics";
import { MOMENTS, type Moment } from "@/core/nutrition/moments";
import { qualitySummary } from "@/core/nutrition/quality-summary";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { detailLines, stripValues } from "@/core/nutrition/display";
import type { MealWithLines } from "@/core/nutrition/repositories/meals";
import type { UsageMap } from "@/core/nutrition/repositories/usage";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, macroLabels, type Messages } from "@/i18n";
import { FoodDetails } from "@/ui/FoodDetails";
import { MealQuality } from "./MealQuality";
import { FoodCardMeta } from "@/ui/FoodCardMeta";
import { ListItem } from "@/ui/ListItem";
import { MacroStrip } from "@/ui/MacroStrip";
import { MomentIcon } from "@/ui/MomentIcon";
import { ListToolbar } from "@/ui/ListToolbar";
import { SortNote } from "@/ui/SortNote";
import { TrashMenu } from "@/ui/TrashMenu";
import { useListControls } from "@/ui/useListControls";
import { CARD } from "@/ui/Card";

type Props = {
  meals: MealWithLines[];
  usage: UsageMap;
  locale: Locale;
  /** ADR-0012: average score by meal id (rated meals only). */
  ratings: Record<string, number>;
  /** ADR-0012: the union of each meal's ingredients' tags, by meal id. */
  tags: Record<string, { name: string; icon: string }[]>;
  /** The sort the list opens with (preferences). */
  initialSort: { sort: SortKey; per: Per };
  t: Pick<
    Messages,
    | "meals"
    | "nutrients"
    | "search"
    | "macro"
    | "label"
    | "moments"
    | "quality"
    | "ratings"
    | "mealQuality"
    | "actions"
  >;
  /** The row's "⋯ → Delete" and its Undo (ADR-0015): server actions. */
  trash: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
};

export function MealBrowser({
  meals,
  usage,
  ratings,
  tags,
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

  // Filter by category (ADR-0011): null = all meals.
  const [category, setCategory] = useState<Moment | null>(null);

  const shown = useMemo(
    () =>
      browseFoods(category ? rows.filter((r) => r.category === category) : rows, {
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
    [rows, category, list.query, list.sort, list.per, list.direction, locale],
  );

  const labels = macroLabels(t);

  if (meals.length === 0) return <p className="text-muted">{t.meals.empty}</p>;
  return (
    // The search, the order and the list share one card (S20 audit: nothing floats).
    <div className={CARD}>
      <ListToolbar
        {...list.toolbar}
        choices={sortChoices()}
        perChoices={PER}
        shown={shown.length}
        total={rows.length}
        t={t.search}
      />
      <div
        role="group"
        aria-label={t.moments.categoryLabel}
        className="flex flex-wrap gap-1.5"
      >
        {[null, ...MOMENTS].map((m) => (
          <button
            key={m ?? "all"}
            type="button"
            aria-pressed={category === m}
            onClick={() => setCategory(m)}
            className={`inline-flex items-center gap-1 rounded-control border px-2 py-1 text-meta ${
              category === m
                ? "border-ink bg-sheet font-semibold"
                : "border-hairline text-muted hover:border-ink"
            }`}
          >
            {m && <MomentIcon moment={m} size={14} />}
            {m ? t.moments.names[m] : t.moments.all}
          </button>
        ))}
      </div>

      <ul className="grid grid-cols-1 gap-x-8 @3xl:grid-cols-2">
        {shown.map((m) => {
          return (
            <ListItem
              key={m.id}
              href={`/meals/${m.id}`}
              title={m.name}
              action={
                <TrashMenu
                  id={m.id}
                  name={m.name}
                  trash={trash}
                  restore={restore}
                  items={[
                    { label: t.actions.duplicate, href: `/meals/new?copy=${m.id}` },
                  ]}
                  labels={t.actions}
                />
              }
              leading={
                m.category ? (
                  <span className="text-muted" title={t.moments.names[m.category]}>
                    <MomentIcon moment={m.category} />
                  </span>
                ) : undefined
              }
              aside={
                <span className="inline-flex items-center gap-1 text-price">
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
              <MacroStrip
                values={stripValues(m.totals.nutrients, locale)}
                labels={labels}
                withEnergy={false}
              />
              <MealQuality
                summary={qualitySummary(m.lines)}
                rating={ratings[m.id] ?? null}
                tags={tags[m.id] ?? []}
                locale={locale}
                t={t}
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
