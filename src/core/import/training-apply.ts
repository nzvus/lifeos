/**
 * core/import/training-apply.ts — writes training plans (./training-plan.ts)
 * for one owner, through the training repositories, so imported data obeys
 * the same rules as typed data (ADR-0005).
 *
 *   - Exercises are matched by name, case-insensitive, after optional
 *     aliases ("OCTE" -> "Overhead cable triceps extention"); missing ones
 *     are created with the kind their sets imply.
 *   - A session that already exists (same day and label) is skipped, as is a
 *     routine with an existing name or a measurement with the same day and
 *     weight: re-running an import adds nothing twice.
 *
 * `planTrainingImport` reads only (the dry run) but runs the same per-kind
 * set checks as saving, so a session that would be refused shows up in the
 * dry run, not halfway through the real import; `applyTrainingImport` writes.
 */
import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { bodyMeasurements, trainingSessions } from "../db/schema";
import { ownedBy, type Owner } from "../identity/owner";
import type { FieldErrors } from "../shared/result";
import type { ExerciseKind } from "../training/kinds";
import { checkSetsForKinds } from "../training/validation";
import { createExercise, listExercises } from "../training/repositories/exercises";
import { addMeasurement } from "../training/repositories/measurements";
import { createRoutine, listRoutines } from "../training/repositories/routines";
import { createSession } from "../training/repositories/sessions";
import {
  kindOf,
  type PlannedMeasurement,
  type PlannedRoutine,
  type PlannedSession,
} from "./training-plan";

export type TrainingImport = {
  sessions: PlannedSession[];
  routines: PlannedRoutine[];
  measurements: PlannedMeasurement[];
  /** lower-case name -> the name to use instead. */
  aliases?: Record<string, string>;
};

export type TrainingImportPlan = {
  newExercises: { name: string; kind: ExerciseKind }[];
  /** `problems`: what saving would refuse (null = fine). */
  sessions: {
    label: string;
    day: string;
    exists: boolean;
    problems: FieldErrors | null;
  }[];
  routines: { name: string; exists: boolean }[];
  measurements: { day: string; weightKg: string; exists: boolean }[];
};

const key = (name: string) => name.trim().toLowerCase();

function resolve(input: TrainingImport) {
  const alias = Object.fromEntries(
    Object.entries(input.aliases ?? {}).map(([k, v]) => [key(k), v]),
  );
  return (name: string) => alias[key(name)] ?? name.trim();
}

export async function planTrainingImport(
  db: Db,
  owner: Owner,
  input: TrainingImport,
): Promise<TrainingImportPlan> {
  const name = resolve(input);
  const existing = await listExercises(db, owner);
  const known = new Set(existing.map((e) => key(e.name)));
  const created = new Map<string, { name: string; kind: ExerciseKind }>();
  const kindHints = new Map<string, PlannedSession["exercises"][number]["sets"]>();
  for (const s of input.sessions)
    for (const e of s.exercises)
      kindHints.set(key(name(e.name)), [
        ...(kindHints.get(key(name(e.name))) ?? []),
        ...e.sets,
      ]);
  for (const r of input.routines)
    for (const it of r.items)
      if (!kindHints.has(key(name(it.name))))
        kindHints.set(key(name(it.name)), [
          {
            reps: it.reps,
            loadKg: it.loadKg,
            loadText: null,
            loadApprox: false,
            durationS: null,
            speedKmh: null,
            inclinePct: null,
          },
        ]);
  const allNames = [
    ...input.sessions.flatMap((s) => s.exercises.map((e) => name(e.name))),
    ...input.routines.flatMap((r) => r.items.map((i) => name(i.name))),
  ];
  for (const n of allNames)
    if (!known.has(key(n)) && !created.has(key(n)))
      created.set(key(n), { name: n, kind: kindOf(kindHints.get(key(n)) ?? []) });

  const kindByKey = new Map<string, ExerciseKind>([
    ...existing.map((e) => [key(e.name), e.kind] as const),
    ...[...created].map(([k, e]) => [k, e.kind] as const),
  ]);

  const existingSessions = await db
    .select({ day: trainingSessions.day, label: trainingSessions.label })
    .from(trainingSessions)
    .where(ownedBy(trainingSessions, owner));
  const sessionKeys = new Set(existingSessions.map((s) => `${s.day}|${key(s.label)}`));
  const routineNames = new Set((await listRoutines(db, owner)).map((r) => key(r.name)));
  const measured = await db
    .select({ day: bodyMeasurements.day, weightKg: bodyMeasurements.weightKg })
    .from(bodyMeasurements)
    .where(ownedBy(bodyMeasurements, owner));
  const measureKeys = new Set(measured.map((m) => `${m.day}|${Number(m.weightKg)}`));

  return {
    newExercises: [...created.values()],
    sessions: input.sessions.map((s) => ({
      label: s.label,
      day: s.day,
      exists: sessionKeys.has(`${s.day}|${key(s.label)}`),
      problems: checkSetsForKinds(
        s.exercises,
        s.exercises.map((e) => kindByKey.get(key(name(e.name)))!),
      ),
    })),
    routines: input.routines.map((r) => ({
      name: r.name,
      exists: routineNames.has(key(r.name)),
    })),
    measurements: input.measurements.map((m) => ({
      day: m.day,
      weightKg: m.weightKg,
      exists: measureKeys.has(`${m.day}|${Number(m.weightKg)}`),
    })),
  };
}

export async function applyTrainingImport(
  db: Db,
  owner: Owner,
  input: TrainingImport,
  timeZone: string,
): Promise<{
  created: {
    exercises: number;
    sessions: number;
    routines: number;
    measurements: number;
  };
  failed: { what: string; errors: FieldErrors }[];
}> {
  const plan = await planTrainingImport(db, owner, input);
  const name = resolve(input);
  const failed: { what: string; errors: FieldErrors }[] = [];
  for (const e of plan.newExercises) {
    const r = await createExercise(db, owner, {
      name: e.name,
      kind: e.kind,
      muscleGroups: [],
      equipment: null,
      unilateral: false,
      notes: "",
    });
    if (!r.ok) failed.push({ what: `exercise ${e.name}`, errors: r.errors });
  }
  const ids = new Map((await listExercises(db, owner)).map((e) => [key(e.name), e.id]));
  const idOf = (n: string) => ids.get(key(name(n)))!;

  let sessions = 0;
  for (const [i, s] of input.sessions.entries()) {
    if (plan.sessions[i]!.exists) continue;
    const r = await createSession(
      db,
      owner,
      {
        day: s.day,
        label: s.label,
        status: "done",
        time: s.time,
        durationMin: s.durationMin,
        notes: s.notes,
        routineId: null,
        exercises: s.exercises.map((e) => ({
          exerciseId: idOf(e.name),
          restS: e.restS,
          notes: e.notes,
          sets: e.sets.map((x) => ({
            ...x,
            distanceM: null,
            restS: null,
            warmup: false,
          })),
        })),
      },
      timeZone,
    );
    if (r.ok) sessions++;
    else failed.push({ what: `session ${s.label} ${s.day}`, errors: r.errors });
  }

  let routines = 0;
  for (const [i, r] of input.routines.entries()) {
    if (plan.routines[i]!.exists) continue;
    const res = await createRoutine(db, owner, {
      name: r.name,
      notes: "",
      items: r.items.map((it) => ({
        exerciseId: idOf(it.name),
        sets: it.sets,
        reps: it.reps,
        loadKg: it.loadKg,
        durationS: null,
        restS: it.restS,
      })),
    });
    if (res.ok) routines++;
    else failed.push({ what: `routine ${r.name}`, errors: res.errors });
  }

  let measurements = 0;
  for (const [i, m] of input.measurements.entries()) {
    if (plan.measurements[i]!.exists) continue;
    await addMeasurement(db, owner, m);
    measurements++;
  }
  return {
    created: { exercises: plan.newExercises.length, sessions, routines, measurements },
    failed,
  };
}

/** Sessions of mine on a day with a label (used by tests and the CLI). */
export async function sessionExists(
  db: Db,
  owner: Owner,
  day: string,
  label: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: trainingSessions.id })
    .from(trainingSessions)
    .where(
      and(
        ownedBy(trainingSessions, owner),
        eq(trainingSessions.day, day),
        eq(trainingSessions.label, label),
      ),
    );
  return rows.length > 0;
}
