/**
 * core/supplements/repositories/doses.ts — what was taken, and when
 * (ADR-0039): every eaten log line whose ingredient has an active compound,
 * as an amount (mg of caffeine, g of creatine) at an instant. The amount is
 * the line's quantity × servings × the compound per 100. Entries without a
 * time count at noon of their day; planned entries are not taken yet.
 */
import { and, eq, gte, isNull, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import { ingredientCompounds, logEntries, logEntryItems } from "../../db/schema";
import type { Compound } from "../../db/schema/supplements";
import { ownedBy, type Owner } from "../../identity/owner";
import { live } from "../../shared/trash";

export type TakenDose = { compound: Compound; day: string; at: number; amount: number };

export async function dosesBetween(
  db: Db,
  owner: Owner,
  fromDay: string,
  toDay: string,
): Promise<TakenDose[]> {
  const rows = await db
    .select({
      compound: ingredientCompounds.compound,
      per100: ingredientCompounds.amount,
      quantity: logEntryItems.quantity,
      servings: logEntries.servings,
      day: logEntries.day,
      at: logEntries.at,
    })
    .from(logEntryItems)
    .innerJoin(logEntries, eq(logEntryItems.entryId, logEntries.id))
    .innerJoin(
      ingredientCompounds,
      and(
        eq(ingredientCompounds.ingredientId, logEntryItems.ingredientId),
        eq(ingredientCompounds.userId, logEntryItems.userId),
      ),
    )
    .where(
      and(
        ownedBy(logEntries, owner),
        live(logEntries),
        eq(logEntries.status, "eaten"),
        isNull(logEntries.batchId),
        gte(logEntries.day, fromDay),
        lte(logEntries.day, toDay),
      ),
    );
  return rows.map((r) => ({
    compound: r.compound,
    day: r.day,
    at: r.at ? r.at.getTime() : Date.parse(`${r.day}T12:00:00Z`),
    amount: (Number(r.per100) * Number(r.quantity) * Number(r.servings)) / 100,
  }));
}
