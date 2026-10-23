/**
 * core/nutrition/repositories/history.ts — one summary per day over a range:
 * totals and targets for the charts, and what the analysis needs (day type,
 * when each eaten entry was eaten, plans never confirmed).
 *
 * Same rules as the day view: totals computed on read from the log snapshots
 * (ADR-0003/0007), exact until rounded once for display; each day's targets
 * are its fixed copy if it has one, else the default profile (ADR-0008).
 * Three owner-filtered queries for the whole range (entries, lines, plans),
 * not one per day.
 */
import { and, asc, gte, inArray, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayPlans, logEntries, logEntryItems } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { live } from "../../shared/trash";
import { addDays } from "../../shared/dates";
import {
  addTotals,
  sumLines,
  toDisplay,
  type DisplayTotals,
  type ExactTotals,
} from "../totals";
import { per100Of } from "./ingredients";
import { getDefaultProfile, targetsOf, type Targets } from "./profiles";

export type DaySummary = {
  day: string;
  totals: DisplayTotals;
  /** true if anything was logged that day. */
  logged: boolean;
  /** The day's targets, or null when there are none. */
  targets: Targets | null;
  /** The day type the targets come from (name at the time), or null. */
  dayType: string | null;
  /**
   * Each EATEN entry: when (ISO instant, or null if no time), its kcal, and
   * whether it was an estimate (typed totals, ADR-0009) rather than weighed
   * ingredients — ADR-0042 trusts estimates less.
   */
  eaten: { at: string | null; kcal: string; estimated: boolean }[];
  /** Entries still "planned" (ADR-0009): planned but never confirmed. */
  plannedLeft: number;
};

/** One summary per day from `fromDay` to `toDay` inclusive, oldest first. */
export async function getHistory(
  db: Db,
  owner: Owner,
  fromDay: string,
  toDay: string,
): Promise<DaySummary[]> {
  // Only the columns the summary reads: the history is read on every day
  // page render, and the database is billed by transfer (2026-10-24).
  const all = await db
    .select({
      id: logEntries.id,
      day: logEntries.day,
      status: logEntries.status,
      servings: logEntries.servings,
      at: logEntries.at,
      estimated: logEntries.estimated,
    })
    .from(logEntries)
    .where(
      and(
        ownedBy(logEntries, owner),
        live(logEntries),
        gte(logEntries.day, fromDay),
        lte(logEntries.day, toDay),
      ),
    )
    .orderBy(asc(logEntries.day));
  // History = what was eaten (ADR-0009); plans are only counted.
  const entries = all.filter((e) => e.status === "eaten");
  const plannedByDay = new Map<string, number>();
  for (const e of all)
    if (e.status === "planned")
      plannedByDay.set(e.day, (plannedByDay.get(e.day) ?? 0) + 1);
  const ids = entries.map((e) => e.id);
  const items = ids.length
    ? await db
        .select({
          entryId: logEntryItems.entryId,
          quantity: logEntryItems.quantity,
          packagePriceCents: logEntryItems.packagePriceCents,
          packageSize: logEntryItems.packageSize,
          kcal: logEntryItems.kcal,
          protein: logEntryItems.protein,
          carbs: logEntryItems.carbs,
          sugars: logEntryItems.sugars,
          fat: logEntryItems.fat,
          saturatedFat: logEntryItems.saturatedFat,
          fiber: logEntryItems.fiber,
          salt: logEntryItems.salt,
        })
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
  const defaultProfile = await getDefaultProfile(db, owner);
  const defaultTargets = defaultProfile ? targetsOf(defaultProfile) : null;

  const linesByEntry = new Map<string, typeof items>();
  for (const it of items)
    linesByEntry.set(it.entryId, [...(linesByEntry.get(it.entryId) ?? []), it]);

  const exactByDay = new Map<string, ExactTotals[]>();
  const eatenByDay = new Map<string, DaySummary["eaten"]>();
  for (const e of entries) {
    const lines = (linesByEntry.get(e.id) ?? []).map((l) => ({
      quantity: l.quantity,
      per100: per100Of(l),
      packagePriceCents: l.packagePriceCents,
      packageSize: l.packageSize,
    }));
    const exact = sumLines(lines, e.servings);
    exactByDay.set(e.day, [...(exactByDay.get(e.day) ?? []), exact]);
    eatenByDay.set(e.day, [
      ...(eatenByDay.get(e.day) ?? []),
      {
        at: e.at ? e.at.toISOString() : null,
        kcal: exact.nutrients.kcal.toString(),
        estimated: e.estimated,
      },
    ]);
  }
  const planByDay = new Map(plans.map((p) => [p.day, p]));

  const out: DaySummary[] = [];
  for (let day = fromDay; day <= toDay; day = addDays(day, 1)) {
    const parts = exactByDay.get(day) ?? [];
    const plan = planByDay.get(day);
    out.push({
      day,
      totals: toDisplay(addTotals(parts)),
      logged: parts.length > 0,
      targets: plan ? targetsOf(plan) : defaultTargets,
      dayType: plan ? plan.profileName : (defaultProfile?.name ?? null),
      eaten: eatenByDay.get(day) ?? [],
      plannedLeft: plannedByDay.get(day) ?? 0,
    });
  }
  return out;
}
