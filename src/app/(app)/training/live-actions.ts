/**
 * app/(app)/training/live-actions.ts — the writes of the gym ("live") mode
 * (core/training/live.ts): start a routine now, save the whole session as it
 * goes, finish it. Same rules as every action: session from the cookie,
 * core validation, owner-filtered repositories.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { isValidDay, timeIn, todayIn } from "@/core/shared/dates";
import { parseInput } from "@/core/shared/validation";
import {
  finished,
  toSessionValues,
  type LiveExercise,
  type LiveSession,
} from "@/core/training/live";
import { latestPreset, type PresetSet } from "@/core/training/presets";
import { listExercises } from "@/core/training/repositories/exercises";
import { listRoutines } from "@/core/training/repositories/routines";
import {
  createSession,
  listSessions,
  updateSession,
} from "@/core/training/repositories/sessions";
import { sessionInput } from "@/core/training/validation";

/**
 * A routine at its latest version, or one exercise with its working sets of
 * last time, as a PLANNED session: started now in gym mode ("live"), or
 * planned on a day at a time ("plan", from the day page).
 * Or a session done before, as it was (its working sets): "like a past
 * session" (ADR-0035).
 * Form fields: routineId | exerciseId | fromSessionId, mode, day, time.
 */
export async function startOrPlanAction(formData: FormData): Promise<void> {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const today = todayIn(settings.timezone);
  const mode = formData.get("mode") === "plan" ? "plan" : "live";
  const asked = String(formData.get("day") ?? "");
  const day = mode === "plan" && isValidDay(asked) ? asked : today;
  const time =
    mode === "plan"
      ? String(formData.get("time") ?? "")
      : timeIn(new Date(), settings.timezone);
  const routineId = String(formData.get("routineId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");
  const fromSessionId = String(formData.get("fromSessionId") ?? "");
  const [routines, history, catalog] = await Promise.all([
    listRoutines(db, owner),
    listSessions(db, owner, "2000-01-01", today),
    listExercises(db, owner),
  ]);
  const routine = routines.find((r) => r.id === routineId);
  const exercise = catalog.find((e) => e.id === exerciseId);
  let label = t.training.title;
  let sets: { exerciseId: string; restS: number | null; sets: PresetSet[] }[] = [];
  const past = fromSessionId ? history.find((s) => s.id === fromSessionId) : undefined;
  if (past) {
    label = past.label;
    sets = past.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      restS: e.restS,
      sets: e.sets.filter((x) => !x.warmup),
    }));
  } else if (routine) {
    const preset = latestPreset<PresetSet>(routine, history, (it) => ({
      ...it,
      warmup: false,
    }));
    label = preset.label;
    sets = preset.exercises;
  } else if (exercise) {
    // Its working sets of the last session that had it, else one empty set.
    const lastTime = [...history]
      .reverse()
      .flatMap((s) => s.exercises)
      .find((e) => e.exerciseId === exercise.id);
    label = exercise.name;
    const working = lastTime?.sets.filter((x) => !x.warmup) ?? [];
    sets = [
      {
        exerciseId: exercise.id,
        restS: lastTime?.restS ?? null,
        sets: working.length ? working : [{ reps: null, loadKg: null, warmup: false }],
      },
    ];
  }
  const exercises: LiveExercise[] = sets.map((e) => ({
    exerciseId: e.exerciseId,
    restS: e.restS,
    notes: "",
    sets: e.sets.map((s) => ({
      reps: s.reps,
      loadKg: s.loadKg === null ? null : String(Number(s.loadKg)),
      loadText: s.loadText ?? null,
      loadApprox: s.loadApprox ?? false,
      durationS: s.durationS ?? null,
      distanceM: s.distanceM ?? null,
      speedKmh: s.speedKmh ?? null,
      inclinePct: s.inclinePct ?? null,
      restS: null,
      warmup: false,
      done: false,
    })),
  }));
  const input = parseInput(
    sessionInput,
    toSessionValues(
      {
        day,
        label,
        time,
        routineId: past ? past.routineId : (routine?.id ?? null),
        notes: "",
        exercises,
      },
      "planned",
      null,
    ),
  );
  if (!input.ok) throw new Error(`start/plan: ${JSON.stringify(input.errors)}`);
  const r = await createSession(db, owner, input.value, settings.timezone);
  if (!r.ok) throw new Error(`start/plan: ${JSON.stringify(r.errors)}`);
  revalidatePath("/", "layout");
  if (mode === "live") redirect(`/training/${r.value.id}/live`);
}

/**
 * Saves the live session as it is (still planned). The client sends its
 * state; core validation decides what is acceptable, as for any form.
 */
export async function saveLiveAction(
  id: string,
  live: LiveSession,
): Promise<{ ok: boolean }> {
  const { owner, settings } = await requireContext();
  const input = parseInput(sessionInput, toSessionValues(live, "planned", null));
  if (!input.ok) return { ok: false };
  const r = await updateSession(getDb(), owner, id, input.value, settings.timezone);
  return { ok: r.ok };
}

/**
 * Finishes: only the sets done, duration from the start to now (the user's
 * zone, the server's clock), status done. The client then opens the session.
 */
export async function finishLiveAction(
  id: string,
  live: LiveSession,
): Promise<{ ok: boolean }> {
  const { owner, settings } = await requireContext();
  const input = parseInput(
    sessionInput,
    finished(live, timeIn(new Date(), settings.timezone)),
  );
  if (!input.ok) return { ok: false };
  const r = await updateSession(getDb(), owner, id, input.value, settings.timezone);
  if (r.ok) revalidatePath("/", "layout");
  return { ok: r.ok };
}
