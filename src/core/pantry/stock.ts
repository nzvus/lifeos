/**
 * core/pantry/stock.ts — how much of something is at home (ADR-0013/0017),
 * derived from events, never stored: purchases bring it in, eating and
 * cooking take it out, and a count says "this much, now" and replaces the
 * running total from that moment. Pure: the repository gathers the events.
 *
 * "Runs out in N days" = what is left ÷ the average daily use over the last
 * `windowDays` days (only what went out counts as use). Stock never goes
 * below zero at any step: using more than was recorded means it came from
 * untracked stock, and a count fixes the total.
 */
import { Big } from "../shared/decimal";

export type StockEvent = {
  kind: "in" | "out" | "count";
  /** ISO instant. Ties are applied in, out, count order (a count is the last word). */
  at: string;
  /** In the item's unit (g, ml or pieces), exact decimal string. */
  quantity: string;
};

export type Stock = {
  /** What is left, ≥ 0, exact. */
  quantity: string;
  /** Average use per day over the window; null when nothing went out. */
  dailyUse: string | null;
  /** Whole days until it runs out at that pace; null without use. */
  daysLeft: number | null;
};

const ORDER = { in: 0, out: 1, count: 2 } as const;
const DAY_MS = 24 * 60 * 60 * 1000;

export function stockOf(
  events: readonly StockEvent[],
  now: Date,
  windowDays = 30,
): Stock {
  const sorted = [...events]
    .filter((e) => Date.parse(e.at) <= now.getTime())
    .sort((a, b) => a.at.localeCompare(b.at) || ORDER[a.kind] - ORDER[b.kind]);
  let total = new Big(0);
  for (const e of sorted) {
    if (e.kind === "count") total = new Big(e.quantity);
    else if (e.kind === "in") total = total.plus(e.quantity);
    else {
      total = total.minus(e.quantity);
      // Eating what was never recorded as bought: it came from untracked
      // stock, which must not eat into later purchases.
      if (total.lt(0)) total = new Big(0);
    }
  }
  const left = total;

  const since = now.getTime() - windowDays * DAY_MS;
  const used = sorted
    .filter((e) => e.kind === "out" && Date.parse(e.at) > since)
    .reduce((sum, e) => sum.plus(e.quantity), new Big(0));
  if (used.eq(0)) return { quantity: left.toString(), dailyUse: null, daysLeft: null };
  const daily = used.div(windowDays);
  return {
    quantity: left.toString(),
    dailyUse: daily.round(3, Big.roundHalfUp).toString(),
    daysLeft: left.div(daily).round(0, Big.roundDown).toNumber(),
  };
}
