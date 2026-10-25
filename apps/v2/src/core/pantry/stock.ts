/**
 * core/pantry/stock.ts — how much of a food is at home (dossiers/pantry.md
 * §5, v1's ADR-0013/0017 ported), derived from events, never stored:
 * purchases bring it in, the meals already logged take it out, a count
 * («Ne ho…») replaces the running total from its moment. Pure: the
 * repository gathers the events.
 *
 * Pace = what went out over the last `windowDays` ÷ the days with food
 * logged in them (a holiday with nothing logged is not a day of no use).
 * Stock never goes below zero at any step: eating more than was bought
 * came from stock nobody recorded, and must not eat into later purchases.
 */
import Big from "big.js";
import { addDays, type IsoDate } from "../engines/time";

export type StockEvent = {
  kind: "in" | "out" | "count";
  /** The instant; ties go in, out, count (a count is the last word). */
  at: Date;
  /** In the food's unit (g or ml), exact decimal string. */
  quantity: string;
  /** The logical day of `at`, for the pace's window. */
  day: IsoDate;
};

export type Stock = {
  /** What is left, ≥ 0, exact. */
  left: string;
  /** Mean use per logged day over the window; null without use. */
  dailyUse: string | null;
  /** Whole days until it runs out at that pace; null without use. */
  daysLeft: number | null;
};

const ORDER = { in: 0, out: 1, count: 2 } as const;

export function stockOf(
  events: readonly StockEvent[],
  now: Date,
  p: { today: IsoDate; loggedDays: ReadonlySet<IsoDate>; windowDays?: number },
): Stock {
  const sorted = events
    .filter((e) => e.at.getTime() <= now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime() || ORDER[a.kind] - ORDER[b.kind]);
  let total = new Big(0);
  for (const e of sorted) {
    if (e.kind === "count") total = new Big(e.quantity);
    else if (e.kind === "in") total = total.plus(e.quantity);
    else {
      total = total.minus(e.quantity);
      if (total.lt(0)) total = new Big(0);
    }
  }
  const window = p.windowDays ?? 28;
  const since = addDays(p.today, -(window - 1));
  const used = sorted
    .filter((e) => e.kind === "out" && e.day >= since)
    .reduce((s, e) => s.plus(e.quantity), new Big(0));
  const days = [...p.loggedDays].filter((d) => d >= since && d <= p.today).length;
  if (used.eq(0) || days === 0) return { left: total.toString(), dailyUse: null, daysLeft: null };
  const daily = used.div(days);
  return {
    left: total.toString(),
    dailyUse: daily.round(3, Big.roundHalfUp).toString(),
    daysLeft: total.div(daily).round(0, Big.roundDown).toNumber(),
  };
}

/**
 * To buy (§5): what runs out before the next shop plus a 2-day margin, or
 * is under its minimum. Only what has been bought or counted is tracked,
 * so a food eaten but never bought is not a shopping item (§8.5).
 */
export function toBuy(
  s: Stock,
  p: { shopEveryDays: number; minimum?: string | null },
): boolean {
  if (p.minimum != null && new Big(s.left).lt(p.minimum)) return true;
  return s.daysLeft !== null && s.daysLeft < p.shopEveryDays + 2;
}
