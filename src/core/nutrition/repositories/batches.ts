/**
 * core/nutrition/repositories/batches.ts — cooking a meal once, in N
 * portions, to eat over several days (ADR-0017).
 *
 * Cooking copies the meal's lines × N into batch_lines — a snapshot, like a
 * log entry (ADR-0007) — and its ingredients leave the pantry at
 * `cooked_at`. A portion is then logged from the batch (log.ts
 * logPortion): that entry points to the batch and the pantry does not take
 * its ingredients again. Portions left = portions − servings logged from it.
 *
 * Tested in: batches.test.ts.
 */
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import type { Db } from "../../db/client";
import { batches, batchLines, logEntries } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { Big } from "../../shared/decimal";
import { fail, ok, type Result } from "../../shared/result";
import { live } from "../../shared/trash";
import { getMeal } from "./meals";

export type BatchView = typeof batches.$inferSelect & {
  /** Portions not yet logged (never below zero), exact. */
  portionsLeft: string;
};

export async function cookBatch(
  db: Db,
  owner: Owner,
  input: {
    mealId: string;
    portions: number;
    day: string;
    cookedAt: Date;
    notes?: string;
  },
): Promise<Result<{ id: string }>> {
  const meal = await getMeal(db, owner, input.mealId); // owner-checked
  if (!meal) return fail({ mealId: "not_found" });
  if (!Number.isInteger(input.portions) || input.portions < 1)
    return fail({ portions: "not_positive" });
  const id = await db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(batches)
      .values({
        userId: owner.id,
        mealId: meal.id,
        label: meal.name,
        portions: input.portions,
        day: input.day,
        cookedAt: input.cookedAt,
        notes: input.notes ?? "",
      })
      .returning({ id: batches.id });
    await tx.insert(batchLines).values(
      meal.lines.map((line, position) => ({
        userId: owner.id,
        batchId: batch!.id,
        ingredientId: line.ingredientId,
        name: line.ingredientName,
        unit: line.unit,
        // The meal's lines are ONE serving: the batch is N of them.
        quantity: new Big(line.quantity).times(input.portions).toString(),
        ...line.per100,
        ...line.quality,
        packagePriceCents: line.packagePriceCents,
        packageSize: line.packageSize,
        position,
      })),
    );
    return batch!.id;
  });
  return ok({ id });
}

/** My live batches, newest first, with the portions still to eat. */
export async function listBatches(db: Db, owner: Owner): Promise<BatchView[]> {
  const rows = await db
    .select()
    .from(batches)
    .where(and(ownedBy(batches, owner), live(batches)))
    .orderBy(desc(batches.cookedAt));
  if (rows.length === 0) return [];
  const taken = await db
    .select({
      batchId: logEntries.batchId,
      servings: sql<string>`sum(${logEntries.servings})`,
    })
    .from(logEntries)
    .where(
      and(
        ownedBy(logEntries, owner),
        live(logEntries),
        inArray(
          logEntries.batchId,
          rows.map((r) => r.id),
        ),
      ),
    )
    .groupBy(logEntries.batchId);
  const used = new Map(taken.map((t) => [t.batchId, t.servings]));
  return rows.map((b) => {
    const left = new Big(b.portions).minus(used.get(b.id) ?? "0");
    return { ...b, portionsLeft: (left.lt(0) ? new Big(0) : left).toString() };
  });
}

export async function deleteBatch(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(batches)
    .set({ deletedAt: new Date() })
    .where(and(ownedBy(batches, owner), live(batches), eq(batches.id, id)))
    .returning({ id: batches.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}

export async function restoreBatch(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const done = await db
    .update(batches)
    .set({ deletedAt: null })
    .where(and(ownedBy(batches, owner), isNotNull(batches.deletedAt), eq(batches.id, id)))
    .returning({ id: batches.id });
  return done.length ? ok(null) : fail({ _form: "not_found" });
}
