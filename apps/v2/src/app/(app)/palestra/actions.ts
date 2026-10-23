"use server";
/**
 * Gym mode's actions (V-05). Each is a public endpoint: the session's owner,
 * the arguments checked (ids are UUIDs, a routine or an exercise must be the
 * person's own), then core/training, which checks the entry it touches.
 * A set is saved the moment it is ticked.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import {
  addExercise,
  checkSet,
  confirmSets,
  finishSession,
  readExercises,
  readRoutines,
  removeSet,
  saveExerciseSettings,
  saveSet,
  setReadiness,
  startSession,
  type SetError,
  type SetInput,
} from "@/core/training";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WORDS: Record<SetError, string> = {
  reps: "Le ripetizioni sono un numero intero.",
  loadKg: "Scrivi il carico in kg, per esempio 22,5.",
  rir: "Da 0 a 10.",
  durationS: "I secondi sono un numero intero.",
  empty: "Scrivi le ripetizioni (o i secondi).",
};

/** Starts a session today, from one of the person's routines or from none. */
export async function startGym(routineId: string): Promise<void> {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const now = new Date();
  const today = logicalDay(now, clock);
  const routine = routineId
    ? (await readRoutines(db, owner, today, await readExercises(db, owner))).find(
        (r) => r.id === routineId,
      )
    : undefined;
  const id = await startSession(db, owner, {
    day: today,
    startAt: now,
    routineId: routine?.id ?? null,
    exerciseIds: routine?.exercises.map((e) => e.exerciseId) ?? [],
  });
  revalidatePath("/oggi", "layout");
  redirect("/palestra/" + id);
}

/**
 * Saves a set. `timing.startedAt` is when it began (epoch ms: after the
 * setup countdown, or auto mode's clock); `timing.assumed` marks auto
 * mode's sets, confirmed at «Fine».
 */
export async function tickSet(
  entryId: string,
  position: number,
  input: SetInput,
  timing: { startedAt?: number | null; assumed?: boolean } = {},
): Promise<string | null> {
  if (!UUID.test(entryId) || !Number.isInteger(position))
    return "Questa serie non c’è più.";
  const checked = checkSet({
    reps: String(input.reps ?? ""),
    loadKg: String(input.loadKg ?? ""),
    rir: String(input.rir ?? ""),
    durationS: String(input.durationS ?? ""),
    warmup: input.warmup === true,
    perDumbbell: input.perDumbbell === true,
  });
  if (!checked.ok) return WORDS[checked.error];
  const saved = await saveSet(
    await getDb(),
    await requireOwner(),
    entryId,
    position,
    checked.set,
    new Date(),
    {
      startedAt:
        typeof timing.startedAt === "number" && Number.isFinite(timing.startedAt)
          ? new Date(timing.startedAt)
          : null,
      assumed: timing.assumed === true,
    },
  );
  revalidatePath("/palestra", "layout");
  return saved ? null : "Questa serie non c’è più.";
}

export async function untickSet(entryId: string, position: number): Promise<boolean> {
  if (!UUID.test(entryId) || !Number.isInteger(position)) return false;
  const done = await removeSet(await getDb(), await requireOwner(), entryId, position);
  revalidatePath("/palestra", "layout");
  return done;
}

export async function addGymExercise(
  sessionId: string,
  exerciseId: string,
): Promise<boolean> {
  if (!UUID.test(sessionId) || !UUID.test(exerciseId)) return false;
  const owner = await requireOwner();
  const db = await getDb();
  if (!(await readExercises(db, owner)).some((e) => e.id === exerciseId)) return false;
  const id = await addExercise(db, owner, sessionId, exerciseId);
  revalidatePath("/palestra", "layout");
  return id !== null;
}

/** How ready the person feels (1–5), or null to clear it. */
export async function readinessGym(
  sessionId: string,
  value: number | null,
): Promise<boolean> {
  if (!UUID.test(sessionId)) return false;
  const done = await setReadiness(await getDb(), await requireOwner(), sessionId, value);
  revalidatePath("/palestra", "layout");
  return done;
}

/** An exercise's own rest and setup delay (seconds; null: learnt / default). */
export async function exerciseSettingsGym(
  exerciseId: string,
  restS: number | null,
  setupS: number | null,
): Promise<boolean> {
  if (!UUID.test(exerciseId)) return false;
  const done = await saveExerciseSettings(
    await getDb(),
    await requireOwner(),
    exerciseId,
    {
      restS,
      setupS,
    },
  );
  revalidatePath("/palestra", "layout");
  return done;
}

/** Ends the session; its assumed sets are confirmed first (the person said so at «Fine»). */
export async function finishGym(sessionId: string): Promise<void> {
  if (!UUID.test(sessionId)) return;
  const owner = await requireOwner();
  const db = await getDb();
  await confirmSets(db, owner, sessionId);
  await finishSession(db, owner, sessionId, new Date());
  revalidatePath("/oggi", "layout");
  redirect("/oggi");
}
