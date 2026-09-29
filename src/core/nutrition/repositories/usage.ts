/**
 * core/nutrition/repositories/usage.ts — how often, and how recently, each
 * meal and ingredient was logged. Feeds "most used first" ordering
 * (core/shared/search.ts rank).
 *
 * Computed on read from the log itself (ADR-0003 spirit: no stored
 * counters that could drift from the data they count). Two grouped queries,
 * both owner-filtered; cheap at this scale.
 *
 * Ingredient usage counts every entry that contained the ingredient, whether
 * logged alone or inside a meal: "I eat oats every day" should put oats at
 * the top even if they always come inside "Colazione".
 */
import { and, count, eq, gte, isNotNull, max } from "drizzle-orm";
import type { Db } from "../../db/client";
import { logEntries, logEntryItems } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";

export type Usage = { uses: number; lastUsed: string };
export type UsageMap = Record<string, Usage>;

/** Usage since `sinceDay` (inclusive), keyed by meal id and ingredient id. */
export async function getUsage(
  db: Db,
  owner: Owner,
  sinceDay: string,
): Promise<{ meals: UsageMap; ingredients: UsageMap }> {
  const mealRows = await db
    .select({ id: logEntries.mealId, uses: count(), lastUsed: max(logEntries.day) })
    .from(logEntries)
    .where(
      and(
        ownedBy(logEntries, owner),
        isNotNull(logEntries.mealId),
        gte(logEntries.day, sinceDay),
      ),
    )
    .groupBy(logEntries.mealId);

  const ingredientRows = await db
    .select({
      id: logEntryItems.ingredientId,
      uses: count(),
      lastUsed: max(logEntries.day),
    })
    .from(logEntryItems)
    .innerJoin(logEntries, eq(logEntryItems.entryId, logEntries.id))
    .where(
      and(
        ownedBy(logEntryItems, owner),
        isNotNull(logEntryItems.ingredientId),
        gte(logEntries.day, sinceDay),
      ),
    )
    .groupBy(logEntryItems.ingredientId);

  const toMap = (
    rows: { id: string | null; uses: number; lastUsed: string | null }[],
  ) => {
    const map: UsageMap = {};
    for (const r of rows)
      if (r.id && r.lastUsed) map[r.id] = { uses: r.uses, lastUsed: r.lastUsed };
    return map;
  };
  return { meals: toMap(mealRows), ingredients: toMap(ingredientRows) };
}

/** How far back "most used" looks. Long enough to cover a diet phase. */
export const USAGE_WINDOW_DAYS = 60;
