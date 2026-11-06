/**
 * E5 Targets — a day read in its week (engines.md E5; v1 ADR-0047, its rules kept).
 *   energy     a weekly quantity: what the days before ate against their
 *              targets, and what this day could eat to bring the week back,
 *              never more than ±30 % of its own target and never under the
 *              floor (the BMR), so a binge is not "paid back" by fasting
 *              (Cioffi 2018). Offered, not asked.
 *   protein    daily: the days in the good zone; a 250 g day does not undo a 100 g one
 *   fibre, salt, sugars, saturated fat: the week's average against the target
 *   regularity a note (never red) when the logged days swing by more than 30 % of their mean
 * Only logged days count: an unlogged day is unknown, not a fast.
 */
import type { IsoDate } from "../time/date";

export const WEEK_CARRY_CAP = 0.3;
const IRREGULAR = 0.3;

export const AVERAGED = ["fibre", "salt", "sugars", "saturatedFat"] as const;
export type Averaged = (typeof AVERAGED)[number];

export type WeekDay = {
  day: IsoDate;
  logged: boolean;
  /** Eaten totals by nutrient key ("kcal", "protein", "fibre"…). */
  eaten: Readonly<Record<string, number>>;
  targets: Readonly<Record<string, number>> | null;
  /** Where protein's good zone starts, g; null without bands. */
  proteinLow: number | null;
};

export type WeekContext = {
  pastDays: number;
  /** Eaten − target over the logged days before, kcal; null without targets. */
  pastBalance: number | null;
  /** Days from this one to the week's end. */
  daysLeft: number;
  today: { target: number; adjusted: number; capped: boolean } | null;
  protein: { inZone: number; of: number } | null;
  averages: { key: Averaged; average: number; target: number; kind: "min" | "max" }[];
  irregular: boolean;
};

const mean = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / Math.max(1, xs.length);

export function weekContext(
  days: readonly WeekDay[],
  day: IsoDate,
  floorKcal: number | null = null,
): WeekContext {
  const past = days.filter((d) => d.day < day && d.logged);
  const upToDay = days.filter((d) => d.day <= day && d.logged);
  const thisDay = days.find((d) => d.day === day) ?? null;
  const daysLeft = days.filter((d) => d.day >= day).length;

  const withKcal = past.filter((d) => d.targets?.["kcal"] !== undefined);
  const pastBalance = withKcal.length
    ? Math.round(
        withKcal.reduce((a, d) => a + (d.eaten["kcal"] ?? 0) - d.targets!["kcal"]!, 0),
      )
    : null;

  const target = thisDay?.targets?.["kcal"];
  let today: WeekContext["today"] = null;
  if (target !== undefined) {
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
        inZone: withProtein.filter((d) => (d.eaten["protein"] ?? 0) >= d.proteinLow!)
          .length,
        of: withProtein.length,
      }
    : null;

  const averages: WeekContext["averages"] = [];
  for (const key of AVERAGED) {
    const rows = past.filter((d) => d.targets?.[key] !== undefined);
    if (!rows.length) continue;
    averages.push({
      key,
      average: mean(rows.map((d) => d.eaten[key] ?? 0)),
      target: mean(rows.map((d) => d.targets![key]!)),
      kind: key === "fibre" ? "min" : "max",
    });
  }

  const kcals = past.map((d) => d.eaten["kcal"] ?? 0);
  const m = mean(kcals);
  const spread = Math.sqrt(mean(kcals.map((x) => (x - m) ** 2)));
  return {
    pastDays: past.length,
    pastBalance,
    daysLeft,
    today,
    protein,
    averages,
    irregular: kcals.length >= 3 && m > 0 && spread / m > IRREGULAR,
  };
}

/** The average furthest off its target, relative to it; null when all are fine. */
export function weekWatch(w: WeekContext): WeekContext["averages"][number] | null {
  const off = w.averages
    .filter(
      (a) =>
        a.target > 0 && (a.kind === "max" ? a.average > a.target : a.average < a.target),
    )
    .map((a) => ({ a, by: Math.abs(a.average - a.target) / a.target }))
    .sort((x, y) => y.by - x.by);
  return off[0]?.a ?? null;
}
