/**
 * app/(app)/training/live-data.ts — what the gym-mode screen needs, for a
 * session (training/[id]/live) and for a routine edited without starting it
 * (training/routines/[id]/edit): every exercise of mine (name, kind, look,
 * one side at a time, last time) and last time's working sets.
 */
import type { Owner } from "@/core/identity/owner";
import type { Locale } from "@/core/shared/locales";
import { regionOf } from "@/core/training/anatomy";
import { fromStoredSet, type LiveExercise, type LiveSet } from "@/core/training/live";
import { latestPreset, type PresetSet } from "@/core/training/presets";
import type { RoutineView } from "@/core/training/repositories/routines";
import type { SessionView } from "@/core/training/repositories/sessions";
import { listExercises } from "@/core/training/repositories/exercises";
import type { LiveExerciseInfo } from "@/features/training/live/LiveSession";
import type { Messages } from "@/i18n";
import { getDb } from "@/app/_server/runtime";
import { addDays } from "@/core/shared/dates";
import { supplementsDay } from "@/core/supplements/day";
import { dosesBetween } from "@/core/supplements/repositories/doses";
import { editorData } from "./editor-data";

export async function liveData(
  owner: Owner,
  before: string,
  locale: Locale,
  t: Messages["training"],
) {
  const [{ last, previous }, exercises] = await Promise.all([
    editorData(owner, before, locale, t),
    listExercises(getDb(), owner),
  ]);
  const info: Record<string, LiveExerciseInfo> = {};
  const baseline: Record<string, LiveSet[]> = {};
  for (const x of exercises) {
    info[x.id] = {
      name: x.name,
      kind: x.kind,
      pattern: x.pattern,
      region: regionOf(x.muscleGroups),
      unilateral: x.unilateral,
      last: last[x.id] ?? null,
    };
    const p = previous.get(x.id);
    if (p) baseline[x.id] = p.sets.filter((s) => !s.warmup).map(fromStoredSet);
  }
  return { info, baseline };
}

/**
 * A routine as the exercises its next start would have: the last session of
 * it, or its own items (presets.ts), each set planned, not done.
 */
export function routineExercisesNow(
  routine: RoutineView,
  history: readonly SessionView[],
): LiveExercise[] {
  const preset = latestPreset<PresetSet>(routine, history, (it) => ({
    ...it,
    warmup: false,
  }));
  return preset.exercises.map((e) => ({
    exerciseId: e.exerciseId,
    restS: e.restS,
    notes: "",
    sets: e.sets.map((x) => ({
      reps: x.reps,
      loadKg: x.loadKg === null ? null : String(Number(x.loadKg)),
      loadText: x.loadText ?? null,
      loadApprox: x.loadApprox ?? false,
      durationS: x.durationS ?? null,
      distanceM: x.distanceM ?? null,
      speedKmh: x.speedKmh ?? null,
      inclinePct: x.inclinePct ?? null,
      restS: null,
      warmup: false,
      done: false,
      startedAt: null,
      endedAt: null,
    })),
  }));
}

/**
 * ADR-0039: the compounds a session was done with — caffeine in the body
 * at its start and creatine's stores that day; null when neither was taken.
 */
export async function sessionCompounds(
  owner: Owner,
  day: string,
  at: Date,
): Promise<{ caffeineMg: number; creatinePct: number } | null> {
  const doses = await dosesBetween(getDb(), owner, addDays(day, -89), day);
  if (!doses.length) return null;
  const s = supplementsDay({ doses, day, now: at.getTime(), bedtime: null });
  const caffeineMg = s.caffeine.nowMg;
  const creatinePct = Math.round(s.creatine.saturation * 100);
  return caffeineMg || creatinePct ? { caffeineMg, creatinePct } : null;
}
