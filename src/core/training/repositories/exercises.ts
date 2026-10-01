/**
 * core/training/repositories/exercises.ts — the user's exercises (ADR-0005:
 * identities, referenced by sessions and routines). Every query is
 * owner-filtered; deleting an exercise that history uses is refused
 * ("in_use") — merge it into another instead, which moves the history.
 */
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import { exercises, routineItems, sessionExercises } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { live } from "../../shared/trash";
import { fail, ok, pgErrorCode, type Result } from "../../shared/result";
import type { ExerciseInput } from "../validation";

export type Exercise = typeof exercises.$inferSelect;

export async function listExercises(db: Db, owner: Owner): Promise<Exercise[]> {
  return db
    .select()
    .from(exercises)
    .where(and(ownedBy(exercises, owner), live(exercises)))
    .orderBy(asc(exercises.name));
}

/** Several of mine by id (missing or foreign ids are simply absent). */
export async function getExercisesByIds(
  db: Db,
  owner: Owner,
  ids: readonly string[],
): Promise<Exercise[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(exercises)
    .where(
      and(
        ownedBy(exercises, owner),
        live(exercises),
        inArray(exercises.id, [...new Set(ids)]),
      ),
    );
}

export async function createExercise(
  db: Db,
  owner: Owner,
  input: ExerciseInput,
): Promise<Result<Exercise>> {
  try {
    const [row] = await db
      .insert(exercises)
      .values({ ...input, userId: owner.id })
      .returning();
    return ok(row!);
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

export async function updateExercise(
  db: Db,
  owner: Owner,
  id: string,
  input: ExerciseInput,
): Promise<Result<Exercise>> {
  try {
    const [row] = await db
      .update(exercises)
      .set(input)
      .where(and(ownedBy(exercises, owner), live(exercises), eq(exercises.id, id)))
      .returning();
    return row ? ok(row) : fail({ _form: "not_found" });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/**
 * Moves an unused exercise to the trash (ADR-0015); one with history or in
 * a routine: "in_use" — merge it into another instead, which moves the
 * history (mergeExercises).
 */
export async function deleteExercise(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const [inSession] = await db
    .select({ id: sessionExercises.id })
    .from(sessionExercises)
    .where(and(ownedBy(sessionExercises, owner), eq(sessionExercises.exerciseId, id)))
    .limit(1);
  const [inRoutine] = await db
    .select({ id: routineItems.id })
    .from(routineItems)
    .where(and(ownedBy(routineItems, owner), eq(routineItems.exerciseId, id)))
    .limit(1);
  if (inSession || inRoutine) return fail({ _form: "in_use" });
  const trashed = await db
    .update(exercises)
    .set({ deletedAt: new Date() })
    .where(and(ownedBy(exercises, owner), live(exercises), eq(exercises.id, id)))
    .returning({ id: exercises.id });
  return trashed.length ? ok(null) : fail({ _form: "not_found" });
}

/** Takes an exercise out of the trash; a live namesake created since: "duplicate_name". */
export async function restoreExercise(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  try {
    const restored = await db
      .update(exercises)
      .set({ deletedAt: null })
      .where(
        and(
          ownedBy(exercises, owner),
          isNotNull(exercises.deletedAt),
          eq(exercises.id, id),
        ),
      )
      .returning({ id: exercises.id });
    return restored.length ? ok(null) : fail({ _form: "not_found" });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ _form: "duplicate_name" });
    throw e;
  }
}

/**
 * Merges `fromId` into `intoId`: every session and routine line moves to
 * `intoId`, then `fromId` is deleted — one transaction. Both must be mine.
 */
export async function mergeExercises(
  db: Db,
  owner: Owner,
  fromId: string,
  intoId: string,
): Promise<Result<null>> {
  if (fromId === intoId) return fail({ _form: "invalid_choice" });
  const both = await getExercisesByIds(db, owner, [fromId, intoId]);
  if (both.length !== 2) return fail({ _form: "not_found" });
  await db.transaction(async (tx) => {
    await tx
      .update(sessionExercises)
      .set({ exerciseId: intoId })
      .where(
        and(ownedBy(sessionExercises, owner), eq(sessionExercises.exerciseId, fromId)),
      );
    await tx
      .update(routineItems)
      .set({ exerciseId: intoId })
      .where(and(ownedBy(routineItems, owner), eq(routineItems.exerciseId, fromId)));
    await tx
      .delete(exercises)
      .where(and(ownedBy(exercises, owner), eq(exercises.id, fromId)));
  });
  return ok(null);
}
