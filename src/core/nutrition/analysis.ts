/**
 * core/nutrition/analysis.ts — what a period of days says, computed from
 * the history summaries (repositories/history.ts). Pure and tested; the
 * Targets page only displays the results. Nothing here is a judgement or a
 * score: counts, averages and times, each explained on screen.
 *
 *   adherence     per nutrient: days on target / days with a target
 *   byDayType     per day type: how many days, average kcal and protein,
 *                 days with energy on target
 *   eatingTimes   first and last eaten entry, eating window, and where the
 *                 energy falls in the day (only entries with a time)
 *   plansLeft     planned entries never confirmed, on past days
 */
import { Big } from "../shared/decimal";
import { timeIn } from "../shared/dates";
import { average } from "./insights";
import { NUTRIENT_KEYS, type NutrientKey } from "./nutrients";
import type { DaySummary } from "./repositories/history";
import { assessTarget, TARGET_KIND, type Targets } from "./targets";

export type AdherenceRow = {
  nutrient: NutrientKey;
  onTarget: number;
  withTarget: number;
};

/**
 * For each nutrient, over the days something was eaten and a target exists:
 * how many were "on" (min reached, max not passed, target within ±5 %).
 * `targets[i]` are the targets of `history[i]` (with automatic maxima).
 */
export function adherence(
  history: readonly DaySummary[],
  targets: readonly Targets[],
): AdherenceRow[] {
  return NUTRIENT_KEYS.map((nutrient) => {
    let onTarget = 0;
    let withTarget = 0;
    history.forEach((d, i) => {
      if (!d.logged) return;
      const a = assessTarget(
        d.totals.nutrients[nutrient],
        targets[i]![nutrient],
        TARGET_KIND[nutrient],
      );
      if (a.status === "none") return;
      withTarget++;
      if (a.status === "on") onTarget++;
    });
    return { nutrient, onTarget, withTarget };
  });
}

export type DayTypeRow = {
  dayType: string;
  days: number;
  kcal: string;
  protein: string;
  /** Days of this type with energy within ±5 % of its target. */
  kcalOnTarget: number;
};

/** Logged days grouped by day type, most frequent first. */
export function byDayType(history: readonly DaySummary[]): DayTypeRow[] {
  const groups = new Map<string, DaySummary[]>();
  for (const d of history) {
    if (!d.logged || d.dayType === null) continue;
    groups.set(d.dayType, [...(groups.get(d.dayType) ?? []), d]);
  }
  return [...groups.entries()]
    .map(([dayType, days]) => ({
      dayType,
      days: days.length,
      kcal: average(days.map((d) => d.totals.nutrients.kcal))!,
      protein: average(days.map((d) => d.totals.nutrients.protein))!,
      kcalOnTarget: days.filter(
        (d) =>
          assessTarget(d.totals.nutrients.kcal, d.targets?.kcal ?? null, "target")
            .status === "on",
      ).length,
    }))
    .sort((a, b) => b.days - a.days || a.dayType.localeCompare(b.dayType));
}

/** Parts of the day, by the local hour an entry was eaten at. */
export const DAY_PARTS = ["morning", "midday", "afternoon", "evening", "night"] as const;
export type DayPart = (typeof DAY_PARTS)[number];
/** Start hour of each part; night wraps past midnight (22:00–05:00). */
const PART_START: Record<DayPart, number> = {
  morning: 5,
  midday: 11,
  afternoon: 15,
  evening: 18,
  night: 22,
};

function partOf(minutes: number): DayPart {
  const h = minutes / 60;
  if (h >= PART_START.night || h < PART_START.morning) return "night";
  if (h >= PART_START.evening) return "evening";
  if (h >= PART_START.afternoon) return "afternoon";
  if (h >= PART_START.midday) return "midday";
  return "morning";
}

export type EatingTimes = {
  /** Days with at least one timed eaten entry (the base of the averages). */
  days: number;
  /** Average minutes after midnight of the day's first / last entry. */
  first: number | null;
  last: number | null;
  /** Average minutes between first and last entry. */
  window: number | null;
  /** Energy per part of the day, whole percent of all timed energy. */
  parts: { part: DayPart; kcal: string; share: number }[];
  /** Eaten entries without a time (not in the numbers above). */
  untimed: number;
};

export function eatingTimes(
  history: readonly DaySummary[],
  timeZone: string,
): EatingTimes {
  const minutes = (iso: string) => {
    const [h, m] = timeIn(new Date(iso), timeZone).split(":").map(Number);
    return h! * 60 + m!;
  };
  const firsts: number[] = [];
  const lasts: number[] = [];
  const kcalByPart = new Map<DayPart, Big>(DAY_PARTS.map((p) => [p, new Big(0)]));
  let untimed = 0;
  for (const d of history) {
    const timed = d.eaten.filter((e) => e.at !== null);
    untimed += d.eaten.length - timed.length;
    if (timed.length === 0) continue;
    const mins = timed.map((e) => minutes(e.at!));
    firsts.push(Math.min(...mins));
    lasts.push(Math.max(...mins));
    timed.forEach((e, i) => {
      const part = partOf(mins[i]!);
      kcalByPart.set(part, kcalByPart.get(part)!.plus(e.kcal));
    });
  }
  const mean = (xs: number[]) =>
    xs.length === 0 ? null : Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  const total = [...kcalByPart.values()].reduce((a, b) => a.plus(b), new Big(0));
  return {
    days: firsts.length,
    first: mean(firsts),
    last: mean(lasts),
    window: mean(lasts.map((l, i) => l - firsts[i]!)),
    parts: DAY_PARTS.map((part) => {
      const kcal = kcalByPart.get(part)!;
      return {
        part,
        kcal: kcal.toString(),
        share: total.eq(0)
          ? 0
          : kcal.div(total).times(100).round(0, Big.roundHalfUp).toNumber(),
      };
    }),
    untimed,
  };
}

/** Planned entries never confirmed, on days before `today`. */
export function plansLeft(history: readonly DaySummary[], today: string): number {
  return history.filter((d) => d.day < today).reduce((n, d) => n + d.plannedLeft, 0);
}
