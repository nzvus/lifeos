/**
 * core/training/repositories/sessions.ts — training sessions with their
 * exercises and sets (ADR-0005). Reads are three owner-filtered queries for
 * any range of days; writes validate that every exercise (and the routine)
 * is mine and apply the per-kind set rules, then write the session and all
 * its children in one transaction ("replace all" on update, like meals).
 */
import { and, asc, desc, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  exercises,
  routines,
  sessionExercises,
  sets,
  trainingSessions,
} from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { live } from "../../shared/trash";
import { instantFor } from "../../shared/dates";
import { fail, ok, type FieldErrors, type Result } from "../../shared/result";
import type { ExerciseKind, Intensity, SessionStatus } from "../kinds";
import { checkSetsForKinds, type SessionInput } from "../validation";
import { getExercisesByIds } from "./exercises";

export type SetRow = typeof sets.$inferSelect;

export type SessionExerciseView = {
  id: string;
  exerciseId: string;
  name: string;
  kind: ExerciseKind;
  /** Movement pattern and muscle groups (anatomy.ts), for icons and volume. */
  pattern: string | null;
  muscleGroups: string[];
  unilateral: boolean;
  restS: number | null;
  notes: string;
  sets: SetRow[];
};

export type SessionView = {
  id: string;
  day: string;
  label: string;
  status: SessionStatus;
  /** ISO instant, or null if the start time is unknown. */
  startedAt: string | null;
  durationMin: number | null;
  routineId: string | null;
  notes: string;
  /** ADR-0016: set on an estimated session (no exercises). */
  intensity: Intensity | null;
  kcalEstimate: number | null;
  muscleGroups: string[];
  exercises: SessionExerciseView[];
};

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Every session of mine from `fromDay` to `toDay` inclusive, in day order. */
export async function listSessions(
  db: Db,
  owner: Owner,
  fromDay: string,
  toDay: string,
): Promise<SessionView[]> {
  const rows = await db
    .select()
    .from(trainingSessions)
    .where(
      and(
        ownedBy(trainingSessions, owner),
        live(trainingSessions),
        gte(trainingSessions.day, fromDay),
        lte(trainingSessions.day, toDay),
      ),
    )
    .orderBy(
      asc(trainingSessions.day),
      asc(trainingSessions.startedAt),
      asc(trainingSessions.createdAt),
    );
  return withChildren(db, owner, rows);
}

/** One session of mine, or null. */
export async function getSession(
  db: Db,
  owner: Owner,
  id: string,
): Promise<SessionView | null> {
  const rows = await db
    .select()
    .from(trainingSessions)
    .where(
      and(
        ownedBy(trainingSessions, owner),
        live(trainingSessions),
        eq(trainingSessions.id, id),
      ),
    );
  return (await withChildren(db, owner, rows))[0] ?? null;
}

async function withChildren(
  db: Db,
  owner: Owner,
  rows: (typeof trainingSessions.$inferSelect)[],
): Promise<SessionView[]> {
  const ids = rows.map((r) => r.id);
  const items = ids.length
    ? await db
        .select({ item: sessionExercises, exercise: exercises })
        .from(sessionExercises)
        .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
        .where(
          and(ownedBy(sessionExercises, owner), inArray(sessionExercises.sessionId, ids)),
        )
        .orderBy(asc(sessionExercises.position))
    : [];
  const itemIds = items.map((i) => i.item.id);
  const setRows = itemIds.length
    ? await db
        .select()
        .from(sets)
        .where(and(ownedBy(sets, owner), inArray(sets.sessionExerciseId, itemIds)))
        .orderBy(asc(sets.position))
    : [];
  const setsBy = new Map<string, SetRow[]>();
  for (const s of setRows)
    setsBy.set(s.sessionExerciseId, [...(setsBy.get(s.sessionExerciseId) ?? []), s]);
  const itemsBy = new Map<string, SessionExerciseView[]>();
  for (const { item, exercise } of items)
    itemsBy.set(item.sessionId, [
      ...(itemsBy.get(item.sessionId) ?? []),
      {
        id: item.id,
        exerciseId: exercise.id,
        name: exercise.name,
        kind: exercise.kind,
        pattern: exercise.pattern,
        muscleGroups: exercise.muscleGroups,
        unilateral: exercise.unilateral,
        restS: item.restS,
        notes: item.notes,
        sets: setsBy.get(item.id) ?? [],
      },
    ]);
  return rows.map((r) => ({
    id: r.id,
    day: r.day,
    label: r.label,
    status: r.status,
    startedAt: r.startedAt ? r.startedAt.toISOString() : null,
    durationMin: r.durationMin,
    routineId: r.routineId,
    notes: r.notes,
    intensity: r.intensity,
    kcalEstimate: r.kcalEstimate,
    muscleGroups: r.muscleGroups,
    exercises: itemsBy.get(r.id) ?? [],
  }));
}

/** Everything a session references must be mine; its sets must fit their kinds. */
async function check(
  db: Db,
  owner: Owner,
  input: SessionInput,
): Promise<FieldErrors | null> {
  const found = new Map(
    (
      await getExercisesByIds(
        db,
        owner,
        input.exercises.map((e) => e.exerciseId),
      )
    ).map((e) => [e.id, e]),
  );
  const errors: FieldErrors = {};
  input.exercises.forEach((e, i) => {
    if (!found.has(e.exerciseId)) errors[`exercises.${i}.exerciseId`] = "not_found";
  });
  if (Object.keys(errors).length) return errors;
  if (input.routineId) {
    const [r] = await db
      .select({ id: routines.id })
      .from(routines)
      .where(and(ownedBy(routines, owner), eq(routines.id, input.routineId)));
    if (!r) return { routineId: "not_found" };
  }
  return checkSetsForKinds(
    input.exercises,
    input.exercises.map((e) => found.get(e.exerciseId)!.kind),
  );
}

async function writeChildren(
  tx: Tx,
  owner: Owner,
  sessionId: string,
  input: SessionInput,
) {
  for (const [position, e] of input.exercises.entries()) {
    const [item] = await tx
      .insert(sessionExercises)
      .values({
        userId: owner.id,
        sessionId,
        exerciseId: e.exerciseId,
        position,
        restS: e.restS ?? null,
        notes: e.notes,
      })
      .returning({ id: sessionExercises.id });
    if (e.sets.length)
      await tx.insert(sets).values(
        e.sets.map((s, i) => ({
          userId: owner.id,
          sessionExerciseId: item!.id,
          position: i,
          reps: s.reps ?? null,
          loadKg: s.loadKg,
          loadText: s.loadText,
          loadApprox: s.loadApprox,
          durationS: s.durationS ?? null,
          distanceM: s.distanceM ?? null,
          speedKmh: s.speedKmh,
          inclinePct: s.inclinePct,
          restS: s.restS ?? null,
          warmup: s.warmup,
          // Not ticked either way (the editor): a plan is not done yet.
          done: s.done ?? input.status === "done",
        })),
      );
  }
}

function sessionRow(input: SessionInput, timeZone: string) {
  return {
    day: input.day,
    label: input.label,
    status: input.status,
    startedAt: input.time ? instantFor(input.day, input.time, timeZone) : null,
    durationMin: input.durationMin,
    routineId: input.routineId,
    notes: input.notes,
    intensity: input.intensity ?? null,
    kcalEstimate: input.kcalEstimate ?? null,
    muscleGroups: input.muscleGroups ?? [],
  };
}

export async function createSession(
  db: Db,
  owner: Owner,
  input: SessionInput,
  timeZone: string,
): Promise<Result<{ id: string }>> {
  const bad = await check(db, owner, input);
  if (bad) return fail(bad);
  const id = await db.transaction(async (tx) => {
    const [s] = await tx
      .insert(trainingSessions)
      .values({ ...sessionRow(input, timeZone), userId: owner.id })
      .returning({ id: trainingSessions.id });
    await writeChildren(tx, owner, s!.id, input);
    return s!.id;
  });
  return ok({ id });
}

/** Replaces a session and all its exercises and sets. */
export async function updateSession(
  db: Db,
  owner: Owner,
  id: string,
  input: SessionInput,
  timeZone: string,
): Promise<Result<{ id: string }>> {
  const bad = await check(db, owner, input);
  if (bad) return fail(bad);
  const found = await db.transaction(async (tx) => {
    const updated = await tx
      .update(trainingSessions)
      .set(sessionRow(input, timeZone))
      .where(
        and(
          ownedBy(trainingSessions, owner),
          live(trainingSessions),
          eq(trainingSessions.id, id),
        ),
      )
      .returning({ id: trainingSessions.id });
    if (!updated.length) return false;
    // Sets go with their session exercise (cascade).
    await tx
      .delete(sessionExercises)
      .where(and(ownedBy(sessionExercises, owner), eq(sessionExercises.sessionId, id)));
    await writeChildren(tx, owner, id, input);
    return true;
  });
  return found ? ok({ id }) : fail({ _form: "not_found" });
}

/** Moves a session to the trash (ADR-0015): out of every list, progress and "last time". */
export async function deleteSession(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const trashed = await db
    .update(trainingSessions)
    .set({ deletedAt: new Date() })
    .where(
      and(
        ownedBy(trainingSessions, owner),
        live(trainingSessions),
        eq(trainingSessions.id, id),
      ),
    )
    .returning({ id: trainingSessions.id });
  return trashed.length ? ok(null) : fail({ _form: "not_found" });
}

/** Takes a session out of the trash. */
export async function restoreSession(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const restored = await db
    .update(trainingSessions)
    .set({ deletedAt: null })
    .where(
      and(
        ownedBy(trainingSessions, owner),
        isNotNull(trainingSessions.deletedAt),
        eq(trainingSessions.id, id),
      ),
    )
    .returning({ id: trainingSessions.id });
  return restored.length ? ok(null) : fail({ _form: "not_found" });
}

/**
 * For each exercise, the sets of the most recent DONE session that has it
 * (before `beforeDay`, if given) — to prefill a routine and to compare.
 */
export async function lastSets(
  db: Db,
  owner: Owner,
  exerciseIds: readonly string[],
  beforeDay?: string,
): Promise<Map<string, { day: string; sets: SetRow[] }>> {
  if (exerciseIds.length === 0) return new Map();
  const rows = await db
    .select({ day: trainingSessions.day, item: sessionExercises })
    .from(sessionExercises)
    .innerJoin(trainingSessions, eq(sessionExercises.sessionId, trainingSessions.id))
    .where(
      and(
        ownedBy(sessionExercises, owner),
        inArray(sessionExercises.exerciseId, [...exerciseIds]),
        eq(trainingSessions.status, "done"),
        live(trainingSessions),
        ...(beforeDay ? [lte(trainingSessions.day, beforeDay)] : []),
      ),
    )
    .orderBy(desc(trainingSessions.day), desc(trainingSessions.createdAt));
  const latest = new Map<string, { day: string; itemId: string }>();
  for (const r of rows)
    if (!latest.has(r.item.exerciseId))
      latest.set(r.item.exerciseId, { day: r.day, itemId: r.item.id });
  const itemIds = [...latest.values()].map((l) => l.itemId);
  const setRows = itemIds.length
    ? await db
        .select()
        .from(sets)
        .where(and(ownedBy(sets, owner), inArray(sets.sessionExerciseId, itemIds)))
        .orderBy(asc(sets.position))
    : [];
  const out = new Map<string, { day: string; sets: SetRow[] }>();
  for (const [exerciseId, l] of latest)
    out.set(exerciseId, {
      day: l.day,
      sets: setRows.filter((s) => s.sessionExerciseId === l.itemId),
    });
  return out;
}
