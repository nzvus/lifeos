/**
 * core/nutrition/repositories/history.ts — totals for a range of days, for
 * the "last 7 days" chart.
 *
 * Same rules as the day view: totals computed on read from the log snapshots
 * (ADR-0003/0007), exact until rounded once for display; each day's targets
 * are its fixed copy if it has one, else the default profile (ADR-0008).
 * Three owner-filtered queries for the whole range (entries, lines, plans),
 * not one per day.
 */
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayPlans, logEntries, logEntryItems } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { addDays } from "../../shared/dates";
import {
  addTotals,
  sumLines,
  toDisplay,
  type DisplayTotals,
  type ExactTotals,
} from "../totals";
import { per100Of } from "./ingredients";
import { getDefaultTargets, targetsOf, type Targets } from "./profiles";

export type DaySummary = {
  day: string;
  totals: DisplayTotals;
  /** true if anything was logged that day. */
  logged: boolean;
  /** The day's targets, or null when there are none. */
  targets: Targets | null;
};

/** One summary per day from `fromDay` to `toDay` inclusive, oldest first. */
export async function getHistory(
  db: Db,
  owner: Owner,
  fromDay: string,
  toDay: string,
): Promise<DaySummary[]> {
  const entries = await db
    .select()
    .from(logEntries)
    .where(
      and(
        ownedBy(logEntries, owner),
        gte(logEntries.day, fromDay),
        lte(logEntries.day, toDay),
        eq(logEntries.status, "eaten"), // history = what was eaten, not plans (ADR-0009)
      ),
    )
    .orderBy(asc(logEntries.day));
  const ids = entries.map((e) => e.id);
  const items = ids.length
    ? await db
        .select()
        .from(logEntryItems)
        .where(and(ownedBy(logEntryItems, owner), inArray(logEntryItems.entryId, ids)))
    : [];
  const plans = await db
    .select()
    .from(dayPlans)
    .where(
      and(ownedBy(dayPlans, owner), gte(dayPlans.day, fromDay), lte(dayPlans.day, toDay)),
    );
  // Days without a fixed plan follow the default profile (the same for all).
  // Read it directly: asking getDayTargets about some day of the range would
  // return that day's FIXED copy if it has one (a bug the test caught).
  const defaultTargets = await getDefaultTargets(db, owner);

  const linesByEntry = new Map<string, typeof items>();
  for (const it of items)
    linesByEntry.set(it.entryId, [...(linesByEntry.get(it.entryId) ?? []), it]);

  const exactByDay = new Map<string, ExactTotals[]>();
  for (const e of entries) {
    const lines = (linesByEntry.get(e.id) ?? []).map((l) => ({
      quantity: l.quantity,
      per100: per100Of(l),
      packagePriceCents: l.packagePriceCents,
      packageSize: l.packageSize,
    }));
    exactByDay.set(e.day, [
      ...(exactByDay.get(e.day) ?? []),
      sumLines(lines, e.servings),
    ]);
  }
  const planByDay = new Map(plans.map((p) => [p.day, targetsOf(p)]));

  const out: DaySummary[] = [];
  for (let day = fromDay; day <= toDay; day = addDays(day, 1)) {
    const parts = exactByDay.get(day) ?? [];
    out.push({
      day,
      totals: toDisplay(addTotals(parts)),
      logged: parts.length > 0,
      targets: planByDay.get(day) ?? defaultTargets,
    });
  }
  return out;
}
