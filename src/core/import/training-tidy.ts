/**
 * core/import/training-tidy.ts — one-off clean-up of imported training
 * history (2026-10-01), safe to re-run:
 *
 *   - sessions numbered by hand ("PUSH 1" … "PUSH 5") are the same routine:
 *     each session that belongs to a routine (started from it, or labelled
 *     with its name plus an optional number, presets.ts `labelFamily`) is
 *     renamed to the routine's name and linked to it;
 *   - an outdoor run exists as an exercise ("Corsa all'aperto", cardio) and
 *     as a routine ("Corsa", one 30-minute set) so it can be started as a
 *     preset like the treadmill. Existing ones with those names are kept.
 *
 * `planTidy` is the dry run; `applyTidy` writes it.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { trainingSessions } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import { labelFamily } from "../training/presets";
import { createExercise, listExercises } from "../training/repositories/exercises";
import { createRoutine, listRoutines } from "../training/repositories/routines";
import { listSessions } from "../training/repositories/sessions";

export const OUTDOOR_RUN = { exercise: "Corsa all'aperto", routine: "Corsa" } as const;

export type TidyPlan = {
  sessions: { id: string; day: string; from: string; to: string; routineId: string }[];
  createRunExercise: boolean;
  createRunRoutine: boolean;
};

const key = (s: string) => s.trim().toLowerCase();

export async function planTidy(db: Db, owner: Owner): Promise<TidyPlan> {
  const [routines, sessions, exercises] = await Promise.all([
    listRoutines(db, owner),
    listSessions(db, owner, "0001-01-01", "9999-12-31"),
    listExercises(db, owner),
  ]);
  const byFamily = new Map(routines.map((r) => [labelFamily(r.name).family, r]));
  const byId = new Map(routines.map((r) => [r.id, r]));
  const changes: TidyPlan["sessions"] = [];
  for (const s of sessions) {
    const r =
      (s.routineId && byId.get(s.routineId)) || byFamily.get(labelFamily(s.label).family);
    if (r && (s.label !== r.name || s.routineId !== r.id))
      changes.push({ id: s.id, day: s.day, from: s.label, to: r.name, routineId: r.id });
  }
  return {
    sessions: changes.sort((a, b) => a.day.localeCompare(b.day)),
    createRunExercise: !exercises.some((e) => key(e.name) === key(OUTDOOR_RUN.exercise)),
    createRunRoutine: !routines.some((r) => key(r.name) === key(OUTDOOR_RUN.routine)),
  };
}

export async function applyTidy(db: Db, owner: Owner, plan: TidyPlan): Promise<void> {
  await db.transaction(async (tx) => {
    for (const c of plan.sessions)
      await tx
        .update(trainingSessions)
        .set({ label: c.to, routineId: c.routineId })
        .where(and(ownedBy(trainingSessions, owner), eq(trainingSessions.id, c.id)));
  });
  if (plan.createRunExercise) {
    const r = await createExercise(db, owner, {
      name: OUTDOOR_RUN.exercise,
      kind: "cardio",
      pattern: "run",
      muscleGroups: [],
      equipment: null,
      unilateral: false,
      notes: "",
    });
    if (!r.ok)
      throw new Error(
        `cannot create ${OUTDOOR_RUN.exercise}: ${JSON.stringify(r.errors)}`,
      );
  }
  if (plan.createRunRoutine) {
    const run = (await listExercises(db, owner)).find(
      (e) => key(e.name) === key(OUTDOOR_RUN.exercise),
    )!;
    const r = await createRoutine(db, owner, {
      name: OUTDOOR_RUN.routine,
      notes: "",
      items: [
        {
          exerciseId: run.id,
          sets: 1,
          reps: null,
          loadKg: null,
          durationS: 1800,
          restS: null,
        },
      ],
    });
    if (!r.ok)
      throw new Error(
        `cannot create ${OUTDOOR_RUN.routine}: ${JSON.stringify(r.errors)}`,
      );
  }
}
