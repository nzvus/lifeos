/**
 * core/nutrition/metrics.ts — the values a food list can be sorted by: any
 * nutrient or the cost, alone or PER something else ("protein per 100 kcal",
 * "fibre per €", "sugars per carbs", "cost per protein").
 *
 * Rows are either per 100 g/ml (ingredients) or per serving (meals); a ratio
 * of two values of the same row is meaningful either way. Cost is in cents
 * for the same basis (per 100 g for an ingredient, per serving for a meal).
 * Missing values (no price, a zero denominator) give null, which sorting
 * puts last (core/shared/sorting.ts).
 */
import { browse } from "../shared/browse";
import type { Rankable } from "../shared/search";
import type { Direction } from "../shared/sorting";
import { formatCents, formatNumber } from "../shared/format";
import type { Locale } from "../shared/locales";
import { NUTRIENT_UNIT, type NutrientKey } from "./nutrients";

export const METRICS = [
  "kcal",
  "protein",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fiber",
  "salt",
  "cost",
] as const;
export type Metric = (typeof METRICS)[number];

/** What a metric can be divided by ("none" = the value itself). */
export const PER = ["none", "kcal", "cost", "protein", "carbs", "fat", "fiber"] as const;
export type Per = (typeof PER)[number];

export type MetricRow = {
  nutrients: Record<NutrientKey, string>;
  /** Cents for the row's basis, or null when unknown. */
  costCents: number | null;
};

/** What the ratio is multiplied by for display: per 100 kcal, per €, per 100 g (%). */
export const PER_SCALE: Record<Per, number> = {
  none: 1,
  kcal: 100,
  cost: 100, // value per cent × 100 = per €
  protein: 100,
  carbs: 100,
  fat: 100,
  fiber: 100,
};

function raw(row: MetricRow, m: Metric | Exclude<Per, "none">): number | null {
  if (m === "cost") return row.costCents;
  return Number(row.nutrients[m]);
}

/**
 * The value to sort by: `metric` alone, or `metric` per `per`, scaled for
 * reading (PER_SCALE). null when either side is missing or the divisor is 0.
 */
export function metricValue(row: MetricRow, metric: Metric, per: Per): number | null {
  const top = raw(row, metric);
  if (top === null) return null;
  if (per === "none") return top;
  const bottom = raw(row, per);
  if (bottom === null || bottom === 0) return null;
  return (top / bottom) * PER_SCALE[per];
}

/**
 * The direction that answers the usual question first: most protein or
 * fibre (per whatever) first; least energy, sugars, saturates, salt or cost
 * first. Everything else: most first.
 */
export function naturalDirection(metric: Metric): Direction {
  return ["kcal", "sugars", "saturatedFat", "salt", "cost"].includes(metric)
    ? "asc"
    : "desc";
}

/** Every way a food list can be sorted, with the direction it starts in. */
export const SORTS = ["used", "name", ...METRICS] as const;
export type SortKey = (typeof SORTS)[number];

export function sortChoices(): { value: SortKey; natural: Direction }[] {
  return SORTS.map((value) => ({
    value,
    natural:
      value === "used" ? "desc" : value === "name" ? "asc" : naturalDirection(value),
  }));
}

/**
 * Search + sort for the ingredient and meal lists: match and rank the query
 * (core/shared/browse.ts), then order by usage, name, or a metric (per
 * something), missing values last.
 */
export function browseFoods<T>(
  rows: readonly T[],
  opts: {
    query: string;
    describe: (row: T) => Rankable;
    metricRow: (row: T) => MetricRow;
    sort: SortKey;
    per: Per;
    direction: Direction;
    locale: string;
  },
): T[] {
  const { sort, per, metricRow, ...rest } = opts;
  return browse(rows, {
    ...rest,
    sort: sort === "used" || sort === "name" ? sort : "metric",
    values: {
      metric: (r: T) =>
        sort === "used" || sort === "name" ? null : metricValue(metricRow(r), sort, per),
    },
  });
}

/**
 * The sort value as text, for the card that shows why it is where it is:
 * cost in euro, grams or kcal otherwise, "%" when it is a share of another
 * nutrient (g per 100 g).
 */
export function metricText(
  value: number,
  metric: Metric,
  per: Per,
  locale: Locale,
): string {
  if (metric === "cost") return formatCents(Math.round(value), locale);
  const n = formatNumber(String(value), locale, 1);
  if (per === "protein" || per === "carbs" || per === "fat" || per === "fiber")
    return `${n} %`;
  return `${n} ${NUTRIENT_UNIT[metric]}`;
}

/** The current sort value of a row as text, or null (usage/name, or missing). */
export function sortNote(
  row: MetricRow,
  sort: SortKey,
  per: Per,
  locale: Locale,
): string | null {
  if (sort === "used" || sort === "name") return null;
  const v = metricValue(row, sort, per);
  return v === null ? null : metricText(v, sort, per, locale);
}
