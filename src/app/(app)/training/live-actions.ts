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
import { timeIn, todayIn } from "@/core/shared/dates";
import { parseInput } from "@/core/shared/validation";
import {
  finished,
  toSessionValues,
  type LiveExercise,
  type LiveSession,
} from "@/core/training/live";
import { latestPreset, type PresetSet } from "@/core/training/presets";
import { listRoutines } from "@/core/training/repositories/routines";
import {
  createSession,
  listSessions,
  updateSession,
} from "@/core/training/repositories/sessions";
import { sessionInput } from "@/core/training/validation";

/** Starts a routine at its latest version, today, now: a planned session to tick. */
export async function startLiveAction(formData: FormData): Promise<void> {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const today = todayIn(settings.timezone);
  const routineId = String(formData.get("routineId") ?? "");
  const [routines, history] = await Promise.all([
    listRoutines(db, owner),
    listSessions(db, owner, "2000-01-01", today),
  ]);
  const routine = routines.find((r) => r.id === routineId);
  const preset = routine
    ? latestPreset<PresetSet>(routine, history, (it) => ({ ...it, warmup: false }))
    : null;
  const exercises: LiveExercise[] = (preset?.exercises ?? []).map((e) => ({
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
        day: today,
        label: preset?.label ?? t.training.title,
        time: timeIn(new Date(), settings.timezone),
        routineId: routine?.id ?? null,
        notes: "",
        exercises,
      },
      "planned",
      null,
    ),
  );
  if (!input.ok) throw new Error(`live start: ${JSON.stringify(input.errors)}`);
  const r = await createSession(db, owner, input.value, settings.timezone);
  if (!r.ok) throw new Error(`live start: ${JSON.stringify(r.errors)}`);
  revalidatePath("/", "layout");
  redirect(`/training/${r.value.id}/live`);
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
