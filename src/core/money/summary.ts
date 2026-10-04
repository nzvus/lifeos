/**
 * core/money/summary.ts — a month of the ledger at a glance (ADR-0036), the
 * way a banking app shows it. PURE: the page passes the movements.
 *
 *   spent / income / balance    integer cents (spent and income ≥ 0)
 *   pace                        spent by day N vs last month by day N
 *   cumulative                  spent so far per day, this month and last
 *   byCategory                  top-level categories, children inside,
 *                               largest first; "no category" last
 *   shops                       where the money went, top 5
 *   food                        groceries + eating out (starter keys), for
 *                               the comparison with the food eaten
 */
import { addDays } from "../shared/dates";

type Movement = {
  day: string;
  amountCents: number;
  categoryId: string | null;
  shop: string;
};
type Category = {
  id: string;
  name: string;
  icon: string;
  key: string | null;
  kind: "expense" | "income";
  parentId: string | null;
};

export type CategoryTotal = {
  id: string | null;
  name: string;
  icon: string;
  cents: number;
  /** Of the month's spending (or income), 0–1. */
  share: number;
  children: { id: string; name: string; cents: number }[];
};

export type MonthSummary = {
  spentCents: number;
  incomeCents: number;
  balanceCents: number;
  /** Days of the month counted (to today in the current month). */
  days: number;
  daysInMonth: number;
  /** Spent by the same day last month; null without data then. */
  lastMonthSameDayCents: number | null;
  /** Spent per day so far (cumulative), index 0 = the 1st. */
  cumulative: number[];
  /** Last month's, whole. */
  lastCumulative: number[];
  /** At this pace, the month's spending; null for a past month. */
  projectedCents: number | null;
  expenses: CategoryTotal[];
  income: CategoryTotal[];
  shops: { shop: string; cents: number; count: number }[];
  /** Groceries and eating out (with their children). */
  food: { groceriesCents: number; eatingOutCents: number };
};

const monthDays = (month: string) => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

function cumulativeOf(movements: readonly Movement[], month: string, days: number) {
  const perDay = Array.from({ length: days }, () => 0);
  for (const m of movements)
    if (m.amountCents < 0 && m.day.startsWith(month)) {
      const d = Number(m.day.slice(8)) - 1;
      if (d < days) perDay[d]! += -m.amountCents;
    }
  let run = 0;
  return perDay.map((v) => (run += v));
}

function byCategory(
  movements: readonly Movement[],
  categories: readonly Category[],
  kind: "expense" | "income",
  none: string,
): CategoryTotal[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const top = new Map<string | null, CategoryTotal>();
  let total = 0;
  for (const m of movements) {
    if (m.amountCents < 0 !== (kind === "expense")) continue;
    const cents = Math.abs(m.amountCents);
    total += cents;
    const c = m.categoryId ? byId.get(m.categoryId) : undefined;
    const parent = c?.parentId ? byId.get(c.parentId) : c;
    const key = parent?.id ?? null;
    const row = top.get(key) ?? {
      id: key,
      name: parent?.name ?? none,
      icon: parent?.icon ?? "",
      cents: 0,
      share: 0,
      children: [],
    };
    row.cents += cents;
    if (c && c.parentId) {
      const child = row.children.find((x) => x.id === c.id);
      if (child) child.cents += cents;
      else row.children.push({ id: c.id, name: c.name, cents });
    }
    top.set(key, row);
  }
  return [...top.values()]
    .map((r) => ({
      ...r,
      share: total ? r.cents / total : 0,
      children: r.children.sort((a, b) => b.cents - a.cents),
    }))
    .sort((a, b) => (a.id === null ? 1 : b.id === null ? -1 : b.cents - a.cents));
}

export function monthSummary(input: {
  month: string;
  today: string;
  movements: readonly Movement[];
  lastMonth: readonly Movement[];
  categories: readonly Category[];
  /** The name of the "no category" row, translated. */
  none: string;
}): MonthSummary {
  const { month, today, movements, lastMonth, categories } = input;
  const daysInMonth = monthDays(month);
  const current = today.startsWith(month);
  const future = today < `${month}-01`;
  const days = future ? 0 : current ? Number(today.slice(8)) : daysInMonth;
  const spentCents = movements.reduce((a, m) => a + Math.max(0, -m.amountCents), 0);
  const incomeCents = movements.reduce((a, m) => a + Math.max(0, m.amountCents), 0);

  const last = addDays(`${month}-01`, -1).slice(0, 7);
  const lastDays = monthDays(last);
  const lastCumulative = cumulativeOf(lastMonth, last, lastDays);
  const cumulative = cumulativeOf(movements, month, daysInMonth).slice(0, days);
  const sameDay = Math.min(days, lastDays);

  const shops = new Map<string, { shop: string; cents: number; count: number }>();
  for (const m of movements) {
    const name = m.shop.trim();
    if (m.amountCents >= 0 || !name) continue;
    const key = name.toLowerCase();
    const row = shops.get(key) ?? { shop: name, cents: 0, count: 0 };
    row.cents += -m.amountCents;
    row.count++;
    shops.set(key, row);
  }

  const expenses = byCategory(movements, categories, "expense", input.none);
  const keyed = (k: string) => {
    const id = categories.find((c) => c.key === k)?.id;
    return expenses.find((e) => id && e.id === id)?.cents ?? 0;
  };

  return {
    spentCents,
    incomeCents,
    balanceCents: incomeCents - spentCents,
    days,
    daysInMonth,
    lastMonthSameDayCents:
      lastMonth.length && sameDay > 0 ? lastCumulative[sameDay - 1]! : null,
    cumulative,
    lastCumulative,
    projectedCents:
      current && days > 0 ? Math.round((spentCents / days) * daysInMonth) : null,
    expenses,
    income: byCategory(movements, categories, "income", input.none),
    shops: [...shops.values()].sort((a, b) => b.cents - a.cents).slice(0, 5),
    food: { groceriesCents: keyed("groceries"), eatingOutCents: keyed("eating_out") },
  };
}
