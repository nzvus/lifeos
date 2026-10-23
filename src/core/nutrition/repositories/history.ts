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
import Big from "big.js";
import { and, asc, gte, inArray, lte, sql } from "drizzle-orm";
import type { Db } from "../../db/client";
import { dayPlans, logEntries, logEntryItems } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { live } from "../../shared/trash";
import { addDays } from "../../shared/dates";
import { NUTRIENT_KEYS } from "../nutrients";
import {
  addTotals,
  emptyTotals,
  toDisplay,
  type DisplayTotals,
  type ExactTotals,
} from "../totals";
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
  const sums = ids.length
    ? await entrySums(db, owner, ids)
    : new Map<string, ExactTotals>();
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

  const exactByDay = new Map<string, ExactTotals[]>();
  const eatenByDay = new Map<string, DaySummary["eaten"]>();
  for (const e of entries) {
    const exact = scaleTotals(sums.get(e.id) ?? null, e.servings);
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

/**
 * Each entry's lines summed in the database: Σ(per100 × quantity) per
 * nutrient and Σ(price × quantity ÷ package size), whether every line had a
 * price — one row per entry instead of one per line (the day page reads
 * the history on every render; transfer is billed, 2026-10-24). Not yet
 * scaled: `scaleTotals` applies the servings and the ÷ 100, as `sumLines`.
 */
async function entrySums(
  db: Db,
  owner: Owner,
  ids: readonly string[],
): Promise<Map<string, ExactTotals>> {
  const i = logEntryItems;
  const priced = sql`${i.packagePriceCents} is not null and ${i.packageSize} is not null and ${i.packageSize} <> 0`;
  const rows = await db
    .select({
      entryId: i.entryId,
      kcal: sql<string>`sum(${i.kcal} * ${i.quantity})`,
      protein: sql<string>`sum(${i.protein} * ${i.quantity})`,
      carbs: sql<string>`sum(${i.carbs} * ${i.quantity})`,
      sugars: sql<string>`sum(${i.sugars} * ${i.quantity})`,
      fat: sql<string>`sum(${i.fat} * ${i.quantity})`,
      saturatedFat: sql<string>`sum(${i.saturatedFat} * ${i.quantity})`,
      fiber: sql<string>`sum(${i.fiber} * ${i.quantity})`,
      salt: sql<string>`sum(${i.salt} * ${i.quantity})`,
      cost: sql<
        string | null
      >`sum(case when ${priced} then ${i.packagePriceCents} * ${i.quantity} / ${i.packageSize} end)`,
      costComplete: sql<boolean>`bool_and(${priced})`,
    })
    .from(i)
    .where(and(ownedBy(i, owner), inArray(i.entryId, [...ids])))
    .groupBy(i.entryId);
  const out = new Map<string, ExactTotals>();
  for (const r of rows) {
    const t = emptyTotals();
    for (const k of NUTRIENT_KEYS) t.nutrients[k] = new Big(r[k] ?? "0");
    t.costCents = new Big(r.cost ?? "0");
    t.costComplete = r.costComplete !== false;
    out.set(r.entryId, t);
  }
  return out;
}

/** An entry's database sums as `sumLines` gives them: × servings, nutrients ÷ 100; none = zeros. */
export function scaleTotals(sum: ExactTotals | null, servings: string): ExactTotals {
  const t = emptyTotals();
  if (!sum) return t;
  const f = new Big(servings);
  for (const k of NUTRIENT_KEYS) t.nutrients[k] = sum.nutrients[k].times(f).div(100);
  t.costCents = sum.costCents.times(f);
  t.costComplete = sum.costComplete;
  return t;
}
