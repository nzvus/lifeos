/**
 * core/training/repositories/programs.ts — training programs (ADR-0024):
 * ordered slots of routines and rest days, at most one active. What a day
 * holds is derived (core/training/program.ts) from the slots and the
 * sessions done; nothing about the plan is stored.
 *
 * Tested in: programs.test.ts.
 */
import { and, asc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  exercises,
  programs,
  programSlotExercises,
  programSlots,
  routines,
} from "../../db/schema";
import { ownedBy, type Owner } from "../../identity/owner";
import { addDays } from "../../shared/dates";
import { fail, ok, type Result } from "../../shared/result";
import { live } from "../../shared/trash";
import { programPlan, type PlanDay, type Slot } from "../program";
import type { ProgramInput } from "../validation";
import { listSessions } from "./sessions";

export type ProgramView = {
  id: string;
  name: string;
  notes: string;
  startDay: string;
  active: boolean;
  /** Ordered; `name` is the routine's (or the slot's label for a rest). */
  slots: (Slot & { name: string })[];
};

export async function listPrograms(db: Db, owner: Owner): Promise<ProgramView[]> {
  const rows = await db
    .select()
    .from(programs)
    .where(and(ownedBy(programs, owner), live(programs)))
    .orderBy(asc(programs.name));
  if (!rows.length) return [];
  const slots = await db
    .select({
      slot: programSlots,
      routine: routines.name,
      exerciseId: programSlotExercises.exerciseId,
      exercise: exercises.name,
    })
    .from(programSlots)
    .leftJoin(routines, and(eq(programSlots.routineId, routines.id), live(routines)))
    .leftJoin(programSlotExercises, eq(programSlotExercises.slotId, programSlots.id))
    .leftJoin(
      exercises,
      and(eq(programSlotExercises.exerciseId, exercises.id), live(exercises)),
    )
    .where(
      and(
        ownedBy(programSlots, owner),
        inArray(
          programSlots.programId,
          rows.map((r) => r.id),
        ),
      ),
    )
    .orderBy(asc(programSlots.position));
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    notes: p.notes,
    startDay: p.startDay,
    active: p.active,
    slots: slots
      .filter((s) => s.slot.programId === p.id)
      .map(({ slot, routine, exerciseId, exercise }) => ({
        position: slot.position,
        // A routine or exercise in the trash counts as missing: shown by its label.
        routineId: routine === null ? null : slot.routineId,
        exerciseId: exercise === null ? null : exerciseId,
        label: slot.label,
        name: routine ?? exercise ?? slot.label,
      })),
  }));
}

export async function getProgram(db: Db, owner: Owner, id: string) {
  return (await listPrograms(db, owner)).find((p) => p.id === id) ?? null;
}

/** Every routine named must be one of my live routines. */
async function checkSlots(db: Db, owner: Owner, input: ProgramInput) {
  const rIds = [
    ...new Set(input.slots.map((s) => s.routineId).filter((x) => x !== null)),
  ];
  const eIds = [
    ...new Set(input.slots.map((s) => s.exerciseId).filter((x) => x !== null)),
  ];
  const [rs, es] = await Promise.all([
    rIds.length
      ? db
          .select({ id: routines.id })
          .from(routines)
          .where(
            and(ownedBy(routines, owner), live(routines), inArray(routines.id, rIds)),
          )
      : [],
    eIds.length
      ? db
          .select({ id: exercises.id })
          .from(exercises)
          .where(
            and(ownedBy(exercises, owner), live(exercises), inArray(exercises.id, eIds)),
          )
      : [],
  ]);
  const knownR = new Set(rs.map((r) => r.id));
  const knownE = new Set(es.map((r) => r.id));
  for (const [i, s] of input.slots.entries()) {
    if (s.routineId !== null && !knownR.has(s.routineId))
      return { [`slots.${i}.routineId`]: "not_found" as const };
    if (s.exerciseId !== null && !knownE.has(s.exerciseId))
      return { [`slots.${i}.exerciseId`]: "not_found" as const };
  }
  return null;
}

/** Saving an active program makes the others inactive (one plans the days). */
async function write(db: Db, owner: Owner, id: string | null, input: ProgramInput) {
  return db.transaction(async (tx) => {
    if (input.active)
      await tx
        .update(programs)
        .set({ active: false })
        .where(and(ownedBy(programs, owner), id ? ne(programs.id, id) : undefined));
    const values = {
      name: input.name,
      notes: input.notes,
      startDay: input.startDay,
      active: input.active,
    };
    const programId = id
      ? (
          await tx
            .update(programs)
            .set(values)
            .where(and(ownedBy(programs, owner), live(programs), eq(programs.id, id)))
            .returning({ id: programs.id })
        )[0]?.id
      : (
          await tx
            .insert(programs)
            .values({ ...values, userId: owner.id })
            .returning({ id: programs.id })
        )[0]!.id;
    if (!programId) return null;
    await tx
      .delete(programSlots)
      .where(and(ownedBy(programSlots, owner), eq(programSlots.programId, programId)));
    const inserted = await tx
      .insert(programSlots)
      .values(
        input.slots.map((s, position) => ({
          userId: owner.id,
          programId,
          position,
          routineId: s.exerciseId ? null : s.routineId,
          label: s.label,
        })),
      )
      .returning({ id: programSlots.id, position: programSlots.position });
    const withExercise = input.slots
      .map((s, position) => ({ s, position }))
      .filter(({ s }) => s.exerciseId);
    if (withExercise.length)
      await tx.insert(programSlotExercises).values(
        withExercise.map(({ s, position }) => ({
          userId: owner.id,
          slotId: inserted.find((r) => r.position === position)!.id,
          exerciseId: s.exerciseId!,
        })),
      );
    return programId;
  });
}

export async function createProgram(
  db: Db,
  owner: Owner,
  input: ProgramInput,
): Promise<Result<{ id: string }>> {
  const bad = await checkSlots(db, owner, input);
  if (bad) return fail(bad);
  return ok({ id: (await write(db, owner, null, input))! });
}

export async function updateProgram(
  db: Db,
  owner: Owner,
  id: string,
  input: ProgramInput,
): Promise<Result<null>> {
  const bad = await checkSlots(db, owner, input);
  if (bad) return fail(bad);
  return (await write(db, owner, id, input)) ? ok(null) : fail({ _form: "not_found" });
}

export async function deleteProgram(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const r = await db
    .update(programs)
    .set({ deletedAt: new Date(), active: false })
    .where(and(ownedBy(programs, owner), live(programs), eq(programs.id, id)))
    .returning({ id: programs.id });
  return r.length ? ok(null) : fail({ _form: "not_found" });
}

export async function restoreProgram(
  db: Db,
  owner: Owner,
  id: string,
): Promise<Result<null>> {
  const r = await db
    .update(programs)
    .set({ deletedAt: null })
    .where(
      and(ownedBy(programs, owner), isNotNull(programs.deletedAt), eq(programs.id, id)),
    )
    .returning({ id: programs.id });
  return r.length ? ok(null) : fail({ _form: "not_found" });
}

export type ActivePlan = {
  program: ProgramView;
  plan: PlanDay[];
  doneToday: boolean;
};

/** The active program's next `days` days from today, or null without one. */
export async function getActivePlan(
  db: Db,
  owner: Owner,
  today: string,
  days = 7,
): Promise<ActivePlan | null> {
  const program = (await listPrograms(db, owner)).find((p) => p.active);
  if (!program) return null;
  const done = await listSessions(db, owner, program.startDay, today);
  const { plan, doneToday } = programPlan({
    slots: program.slots,
    startDay: program.startDay,
    today,
    done: done
      .filter((s) => s.status === "done")
      .map((s) => ({
        day: s.day,
        routineId: s.routineId,
        exerciseIds: s.exercises.map((e) => e.exerciseId),
      })),
    days,
  });
  return { program, plan, doneToday };
}

/** The slot the active program puts on `day` (from today on), or null. */
export async function programSlotOn(
  db: Db,
  owner: Owner,
  today: string,
  day: string,
): Promise<(PlanDay & { program: string; name: string }) | null> {
  if (day < today || day > addDays(today, 27)) return null;
  const a = await getActivePlan(db, owner, today, 28);
  const hit = a?.plan.find((p) => p.day === day);
  if (!a || !hit) return null;
  const name = a.program.slots.find((x) => x.position === hit.slot.position)?.name ?? "";
  return { ...hit, program: a.program.name, name };
}
