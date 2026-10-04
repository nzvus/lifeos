/**
 * core/training/repositories/routines.ts — routines (ADR-0005): templates
 * like PUSH or Upper A, each a list of exercises with default sets. A
 * session started from a routine keeps a link to it but stands on its own.
 */
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import { exercises, routineItems, routines } from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { live } from "../../shared/trash";
import type { ExerciseKind } from "../kinds";
import {
  fail,
  ok,
  pgErrorCode,
  type FieldErrors,
  type Result,
} from "../../shared/result";
import type { RoutineInput } from "../validation";
import { getExercisesByIds } from "./exercises";

export type RoutineView = {
  id: string;
  name: string;
  notes: string;
  /** ISO instant of the last save by hand, or null (presets.ts). */
  itemsSavedAt: string | null;
  items: (Omit<typeof routineItems.$inferSelect, "userId" | "routineId"> & {
    name: string;
    /** The exercise's, for its drawing (ui/ExerciseIcon). */
    pattern: string | null;
    muscleGroups: string[];
    kind: ExerciseKind;
  })[];
};

export async function listRoutines(db: Db, owner: Owner): Promise<RoutineView[]> {
  const rows = await db
    .select()
    .from(routines)
    .where(and(ownedBy(routines, owner), live(routines)))
    .orderBy(asc(routines.position), asc(routines.name));
  const ids = rows.map((r) => r.id);
  const items = ids.length
    ? await db
        .select({
          item: routineItems,
          name: exercises.name,
          pattern: exercises.pattern,
          muscleGroups: exercises.muscleGroups,
          kind: exercises.kind,
        })
        .from(routineItems)
        .innerJoin(exercises, eq(routineItems.exerciseId, exercises.id))
        .where(and(ownedBy(routineItems, owner), inArray(routineItems.routineId, ids)))
        .orderBy(asc(routineItems.position))
    : [];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    notes: r.notes,
    itemsSavedAt: r.itemsSavedAt ? r.itemsSavedAt.toISOString() : null,
    items: items
      .filter((i) => i.item.routineId === r.id)
      .map(({ item: { userId: _u, routineId: _r, ...rest }, ...exercise }) => ({
        ...rest,
        ...exercise,
      })),
  }));
}

async function checkItems(
  db: Db,
  owner: Owner,
  input: RoutineInput,
): Promise<FieldErrors | null> {
  const mine = new Set(
    (
      await getExercisesByIds(
        db,
        owner,
        input.items.map((i) => i.exerciseId),
      )
    ).map((e) => e.id),
  );
  const errors: FieldErrors = {};
  input.items.forEach((it, i) => {
    if (!mine.has(it.exerciseId)) errors[`items.${i}.exerciseId`] = "not_found";
  });
  return Object.keys(errors).length ? errors : null;
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
async function writeItems(tx: Tx, owner: Owner, routineId: string, input: RoutineInput) {
  if (input.items.length)
    await tx.insert(routineItems).values(
      input.items.map((it, position) => ({
        userId: owner.id,
        routineId,
        exerciseId: it.exerciseId,
        position,
        sets: it.sets,
        reps: it.reps ?? null,
        loadKg: it.loadKg,
        durationS: it.durationS ?? null,
        restS: it.restS ?? null,
      })),
    );
}

export async function createRoutine(
  db: Db,
  owner: Owner,
  input: RoutineInput,
): Promise<Result<{ id: string }>> {
  const bad = await checkItems(db, owner, input);
  if (bad) return fail(bad);
  try {
    const id = await db.transaction(async (tx) => {
      const [r] = await tx
        .insert(routines)
        .values({ userId: owner.id, name: input.name, notes: input.notes })
        .returning({ id: routines.id });
      await writeItems(tx, owner, r!.id, input);
      return r!.id;
    });
    return ok({ id });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/** Replaces a routine's name, notes and items. */
export async function updateRoutine(
  db: Db,
  owner: Owner,
  id: string,
  input: RoutineInput,
): Promise<Result<{ id: string }>> {
  const bad = await checkItems(db, owner, input);
  if (bad) return fail(bad);
  try {
    const found = await db.transaction(async (tx) => {
      const updated = await tx
        .update(routines)
        // Saved by hand: the next start uses these items (presets.ts).
        .set({ name: input.name, notes: input.notes, itemsSavedAt: new Date() })
        .where(and(ownedBy(routines, owner), live(routines), eq(routines.id, id)))
        .returning({ id: routines.id });
      if (!updated.length) return false;
      await tx
        .delete(routineItems)
        .where(and(ownedBy(routineItems, owner), eq(routineItems.routineId, id)));
      await writeItems(tx, owner, id, input);
      return true;
    });
    return found ? ok({ id }) : fail({ _form: "not_found" });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ name: "duplicate_name" });
    throw e;
  }
}

/**
 * Moves a routine to the trash (ADR-0015). Sessions started from it keep
 * their link, so restoring it brings its history back with it.
 */
export async function deleteRoutine(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const trashed = await db
    .update(routines)
    .set({ deletedAt: new Date() })
    .where(and(ownedBy(routines, owner), live(routines), eq(routines.id, id)))
    .returning({ id: routines.id });
  return trashed.length ? ok(null) : fail({ _form: "not_found" });
}

/** Takes a routine out of the trash; a live namesake created since: "duplicate_name". */
export async function restoreRoutine(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  try {
    const restored = await db
      .update(routines)
      .set({ deletedAt: null })
      .where(
        and(ownedBy(routines, owner), isNotNull(routines.deletedAt), eq(routines.id, id)),
      )
      .returning({ id: routines.id });
    return restored.length ? ok(null) : fail({ _form: "not_found" });
  } catch (e) {
    if (pgErrorCode(e) === "23505") return fail({ _form: "duplicate_name" });
    throw e;
  }
}
