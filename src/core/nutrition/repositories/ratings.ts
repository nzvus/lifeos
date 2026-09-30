/**
 * core/nutrition/repositories/ratings.ts — meal ratings (ADR-0012, option A):
 * the factors the user rates on ("Gusto", "Sazietà"…) and each meal's 1–5
 * score per factor. Scores are written with the meal (meals.ts), in the same
 * transaction; this file owns the factors and the reads.
 */
import { and, asc, eq, max } from "drizzle-orm";
import type { Db } from "../../db/client";
import { mealRatings, ratingFactors } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { fail, ok, pgErrorCode, type Result } from "../../shared/result";

export type RatingFactor = { id: string; name: string; position: number };

/** My factors, in their order. */
export async function listFactors(db: Db, owner: Owner): Promise<RatingFactor[]> {
  return db
    .select({
      id: ratingFactors.id,
      name: ratingFactors.name,
      position: ratingFactors.position,
    })
    .from(ratingFactors)
    .where(ownedBy(ratingFactors, owner))
    .orderBy(asc(ratingFactors.position), asc(ratingFactors.name));
}

/** A new factor, last in order. */
export async function createFactor(
  db: Db,
  owner: Owner,
  name: string,
): Promise<Result<RatingFactor>> {
  const [last] = await db
    .select({ n: max(ratingFactors.position) })
    .from(ratingFactors)
    .where(ownedBy(ratingFactors, owner));
  try {
    const [row] = await db
      .insert(ratingFactors)
      .values({ userId: owner.id, name, position: (last?.n ?? -1) + 1 })
      .returning({
        id: ratingFactors.id,
        name: ratingFactors.name,
        position: ratingFactors.position,
      });
    return ok(row!);
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/** Deletes one of my factors; its scores go with it (cascade). */
export async function deleteFactor(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const gone = await db
    .delete(ratingFactors)
    .where(and(ownedBy(ratingFactors, owner), eq(ratingFactors.id, id)))
    .returning({ id: ratingFactors.id });
  return gone.length ? ok(null) : fail({ _form: "not_found" });
}

/** Every meal's scores: meal id -> factor id -> 1..5. */
export async function ratingsByMeal(
  db: Db,
  owner: Owner,
): Promise<Map<string, Record<string, number>>> {
  const rows = await db
    .select({
      mealId: mealRatings.mealId,
      factorId: mealRatings.factorId,
      score: mealRatings.score,
    })
    .from(mealRatings)
    .where(ownedBy(mealRatings, owner));
  const out = new Map<string, Record<string, number>>();
  for (const r of rows)
    out.set(r.mealId, { ...(out.get(r.mealId) ?? {}), [r.factorId]: r.score });
  return out;
}

/** Each rated meal's average score (one decimal), from ratingsByMeal. */
export function averageScores(
  byMeal: Map<string, Record<string, number>>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [mealId, scores] of byMeal) {
    const values = Object.values(scores);
    if (values.length)
      out[mealId] =
        Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  }
  return out;
}
