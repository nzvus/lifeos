/**
 * core/money/month.ts — «Soldi» (V-11, the board Money): a month in
 * numbers. Spent and earned this month so far; the same days of the month
 * before, for the pace («+12 % rispetto a settembre allo stesso giorno»);
 * spending by top category (a sub-category counts for its parent); each
 * day's movements with the day's total. Pure.
 */
import type { IsoDate } from "../engines/time";
import type { Category, Movement } from "./index";

export type MonthMoney = {
  spentCents: number;
  earnedCents: number;
  /** Spent in the month before up to the same day of the month; null without it. */
  beforeCents: number | null;
  byCategory: { id: string | null; cents: number }[];
  days: { day: IsoDate; cents: number; movements: Movement[] }[];
};

export function monthMoney(
  month: readonly Movement[],
  before: readonly Movement[] | null,
  categories: readonly Category[],
  /** The last day counted of this month (today, or the month's end). */
  upTo: IsoDate,
): MonthMoney {
  const cat = new Map(categories.map((c) => [c.id, c]));
  const top = (id: string | null) => {
    const c = id ? cat.get(id) : undefined;
    return c?.parentId ?? c?.id ?? null;
  };
  const spent = month.filter((m) => m.cents < 0);
  const by = new Map<string | null, number>();
  for (const m of spent)
    by.set(top(m.categoryId), (by.get(top(m.categoryId)) ?? 0) - m.cents);
  const dayOfMonth = upTo.slice(8);
  const days = new Map<IsoDate, Movement[]>();
  for (const m of month) days.set(m.day, [...(days.get(m.day) ?? []), m]);
  return {
    spentCents: -spent.reduce((a, m) => a + m.cents, 0),
    earnedCents: month.filter((m) => m.cents > 0).reduce((a, m) => a + m.cents, 0),
    beforeCents: before
      ? -before
          .filter((m) => m.cents < 0 && m.day.slice(8) <= dayOfMonth)
          .reduce((a, m) => a + m.cents, 0)
      : null,
    byCategory: [...by]
      .map(([id, cents]) => ({ id, cents }))
      .sort((a, b) => b.cents - a.cents),
    days: [...days]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([day, movements]) => ({
        day,
        cents: movements.reduce((a, m) => a + m.cents, 0),
        movements: [...movements].reverse(),
      })),
  };
}
