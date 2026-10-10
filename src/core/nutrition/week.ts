/**
 * core/nutrition/week.ts — a day read in its week (plan §2.2b, ADR-0047).
 * Pure.
 *
 *   energy     a weekly quantity: what the days before this one ate
 *              against their targets, and what this day could eat to
 *              bring the week back. That is never more than ±30 % of its
 *              own target and never under the calorie floor (the BMR),
 *              so a binge is not "paid back" by fasting
 *              (Cioffi 2018: the same loss either way, within limits).
 *              Offered, not asked: MacroFactor re-plans from what happened
 *              instead.
 *   protein    daily: the days in the good zone. A 250 g day does not
 *              undo a 100 g one.
 *   fibre, salt, sugars, saturated fat: what matters for health is the
 *              average, so the week's average against the target.
 *   regularity a note (never red) when the logged days swing by more than
 *              30 % of their mean.
 *
 * Only days with something logged count: an unlogged day is unknown, not
 * a fast. The week is the calendar week (Monday on), the one the page
 * already reads and the check-in's default.
 */
import type { NutrientKey } from "./nutrients";

/** At most this share of a day's target moves to bring the week back. */
export const WEEK_CARRY_CAP = 0.3;
/** Above this spread (standard deviation ÷ mean) the week is irregular. */
const IRREGULAR = 0.3;

export type WeekDayInput = {
  day: string;
  logged: boolean;
  /** Eaten totals of the day. */
  eaten: Record<NutrientKey, string>;
  /** The day's targets (null = none). */
  targets: Record<NutrientKey, string | null> | null;
  /** Where protein's good zone starts, g; null without bands. */
  proteinLow: number | null;
};

export const AVERAGED = ["fiber", "salt", "sugars", "saturatedFat"] as const;
export type Averaged = (typeof AVERAGED)[number];

export type WeekContext = {
  /** Logged days before this one in the week. */
  pastDays: number;
  /** Their eaten − target, kcal (+ over, − under); null without targets. */
  pastBalance: number | null;
  /** Days from this one to Sunday. */
  daysLeft: number;
  /** This day's target, and the one that would bring the week back (capped). */
  today: { target: number; adjusted: number; capped: boolean } | null;
  /** Days with protein in the good zone, of the logged days up to this one. */
  protein: { inZone: number; of: number } | null;
  /** The logged days' average and the average target, per nutrient. */
  averages: { key: Averaged; average: number; target: number; kind: "min" | "max" }[];
  irregular: boolean;
};

const n = (v: string | null | undefined) =>
  v === null || v === undefined ? null : Number(v);

export function weekContext(
  days: readonly WeekDayInput[],
  day: string,
  /** Never propose less than this (the BMR, ADR-0043's floor); null = none. */
  floorKcal: number | null = null,
): WeekContext {
  const past = days.filter((d) => d.day < day && d.logged);
  const upToDay = days.filter((d) => d.day <= day && d.logged);
  const thisDay = days.find((d) => d.day === day) ?? null;
  const daysLeft = days.filter((d) => d.day >= day).length;

  const withKcal = past.filter((d) => n(d.targets?.kcal) !== null);
  const pastBalance = withKcal.length
    ? Math.round(
        withKcal.reduce((a, d) => a + Number(d.eaten.kcal) - Number(d.targets!.kcal), 0),
      )
    : null;

  const target = n(thisDay?.targets?.kcal);
  let today: WeekContext["today"] = null;
  if (target !== null) {
    const want = target - (pastBalance ?? 0) / Math.max(1, daysLeft);
    const low = target * (1 - WEEK_CARRY_CAP);
    const high = target * (1 + WEEK_CARRY_CAP);
    const adjusted = Math.round(Math.min(high, Math.max(low, floorKcal ?? 0, want)));
    today = {
      target: Math.round(target),
      adjusted,
      capped: adjusted !== Math.round(want),
    };
  }

  const withProtein = upToDay.filter((d) => d.proteinLow !== null);
  const protein = withProtein.length
    ? {
        inZone: withProtein.filter((d) => Number(d.eaten.protein) >= d.proteinLow!)
          .length,
        of: withProtein.length,
      }
    : null;

  const averages: WeekContext["averages"] = [];
  for (const key of AVERAGED) {
    const rows = past.filter((d) => n(d.targets?.[key]) !== null);
    if (!rows.length) continue;
    const mean = (f: (d: WeekDayInput) => number) =>
      rows.reduce((a, d) => a + f(d), 0) / rows.length;
    averages.push({
      key,
      average: mean((d) => Number(d.eaten[key])),
      target: mean((d) => Number(d.targets![key])),
      kind: key === "fiber" ? "min" : "max",
    });
  }

  const kcals = past.map((d) => Number(d.eaten.kcal));
  const meanKcal = kcals.reduce((a, x) => a + x, 0) / Math.max(1, kcals.length);
  const spread = Math.sqrt(
    kcals.reduce((a, x) => a + (x - meanKcal) ** 2, 0) / Math.max(1, kcals.length),
  );
  return {
    pastDays: past.length,
    pastBalance,
    daysLeft,
    today,
    protein,
    averages,
    irregular: kcals.length >= 3 && meanKcal > 0 && spread / meanKcal > IRREGULAR,
  };
}
