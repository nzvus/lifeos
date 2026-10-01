/**
 * core/training/live.ts — the gym ("live") mode of a session (S07), pure.
 *
 * A live session is an ordinary PLANNED session whose sets are the plan:
 * each set is `done` once ticked. The client edits it and saves the whole of
 * it as it goes (repositories/sessions updateSession), so a reload, a dead
 * battery or another device loses nothing. Finishing keeps only the sets
 * that were done, drops exercises left empty, sets the duration from the
 * start time and marks the session done.
 */
export type LiveSet = {
  reps: number | null;
  loadKg: string | null;
  loadText: string | null;
  loadApprox: boolean;
  durationS: number | null;
  distanceM: number | null;
  speedKmh: string | null;
  inclinePct: string | null;
  restS: number | null;
  warmup: boolean;
  done: boolean;
};

export type LiveExercise = {
  exerciseId: string;
  restS: number | null;
  notes: string;
  sets: LiveSet[];
};

export type LiveSession = {
  day: string;
  label: string;
  /** "HH:MM" in the user's zone; "" until the first set is ticked. */
  time: string;
  routineId: string | null;
  notes: string;
  exercises: LiveExercise[];
};

/** Rest when the exercise has none of its own (seconds). */
export const DEFAULT_REST_S = 90;

/** The first set not done yet, in order; null when everything is done. */
export function nextSet(
  exercises: readonly LiveExercise[],
): { exercise: number; set: number } | null {
  for (const [i, e] of exercises.entries()) {
    const j = e.sets.findIndex((s) => !s.done);
    if (j >= 0) return { exercise: i, set: j };
  }
  return null;
}

/** How much one tap changes a load: 2.5 kg from 20 kg up (plates), else 1 kg (dumbbells, cables). */
export function loadStep(kg: number): number {
  return kg >= 20 ? 2.5 : 1;
}

/** A load moved by one step up (+1) or down (−1), never below 0; exact to 0.01. */
export function stepLoad(loadKg: string | null, direction: 1 | -1): string {
  const kg = Number(loadKg ?? 0);
  const step = loadStep(direction === 1 ? kg : Math.max(0, kg - 0.01));
  const next = Math.max(0, Math.round((kg + direction * step) * 100) / 100);
  return String(next);
}

/** A new set like the last one of the exercise, not done (or an empty one). */
export function copyLastSet(e: LiveExercise): LiveSet {
  const last = e.sets.at(-1);
  return last
    ? { ...last, warmup: false, done: false }
    : {
        reps: null,
        loadKg: null,
        loadText: null,
        loadApprox: false,
        durationS: null,
        distanceM: null,
        speedKmh: null,
        inclinePct: null,
        restS: null,
        warmup: false,
        done: false,
      };
}

/** The form-shaped values core/training/validation sessionInput parses. */
export function toSessionValues(
  s: LiveSession,
  status: "planned" | "done",
  durationMin: number | null,
): Record<string, string> {
  return {
    day: s.day,
    label: s.label,
    status,
    time: s.time,
    durationMin: durationMin === null ? "" : String(durationMin),
    notes: s.notes,
    routineId: s.routineId ?? "",
    // The editor's wire format: optional texts and decimals as "" when empty.
    exercises: JSON.stringify(
      s.exercises.map((e) => ({
        ...e,
        sets: e.sets.map((x) => ({
          ...x,
          loadKg: x.loadKg ?? "",
          loadText: x.loadText ?? "",
          speedKmh: x.speedKmh ?? "",
          inclinePct: x.inclinePct ?? "",
        })),
      })),
    ),
  };
}

/** Whole minutes from "HH:MM" to `now` ("HH:MM", same day), 1–999; null when unknown. */
export function minutesSince(start: string, now: string): number | null {
  if (!start) return null;
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const d = m(now) - m(start);
  return d <= 0 ? 1 : Math.min(999, d);
}

/** The session as it is saved when finished: only what was done. */
export function finished(s: LiveSession, now: string): Record<string, string> {
  const exercises = s.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
    .filter((e) => e.sets.length > 0);
  return toSessionValues({ ...s, exercises }, "done", minutesSince(s.time, now));
}

/** Sets that finishing would drop (to say so before finishing). */
export function undoneCount(s: LiveSession): number {
  return s.exercises.reduce((a, e) => a + e.sets.filter((x) => !x.done).length, 0);
}

/**
 * The "default" a set is compared with: the same set of last time (by
 * position), else last time's last set; null without a history.
 */
export function baselineSet(
  base: readonly LiveSet[] | undefined,
  j: number,
): LiveSet | null {
  if (!base || base.length === 0) return null;
  return base[j] ?? base.at(-1)!;
}

/** What one set is worth, to compare it: reps × kg (reps alone without a load); cardio: km, else minutes. */
function worth(
  kind: "strength" | "bodyweight" | "cardio",
  s: LiveSet,
  b: LiveSet,
): [number, number] {
  if (kind === "cardio")
    return s.distanceM && b.distanceM
      ? [s.distanceM, b.distanceM]
      : [s.durationS ?? 0, b.durationS ?? 0];
  const v = (x: LiveSet) => (x.reps ?? 0) * (Number(x.loadKg ?? 0) || 1);
  return [v(s), v(b)];
}

/** Whole-percent change of a set against its baseline; null when there is nothing to compare. */
export function setChange(
  kind: "strength" | "bodyweight" | "cardio",
  s: LiveSet,
  base: LiveSet | null,
): number | null {
  if (!base) return null;
  const [now, before] = worth(kind, s, base);
  if (before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

/** The set with its numbers back to the baseline (done stays as it is). */
export function restoreSet(s: LiveSet, base: LiveSet): LiveSet {
  return {
    ...s,
    reps: base.reps,
    loadKg: base.loadKg,
    loadText: base.loadText,
    loadApprox: base.loadApprox,
    durationS: base.durationS,
    distanceM: base.distanceM,
    speedKmh: base.speedKmh,
    inclinePct: base.inclinePct,
  };
}

/** The list with item `i` moved one place up (−1) or down (+1); unchanged at the ends. */
export function move<T>(list: readonly T[], i: number, direction: 1 | -1): T[] {
  const j = i + direction;
  if (j < 0 || j >= list.length) return [...list];
  const out = [...list];
  [out[i], out[j]] = [out[j]!, out[i]!];
  return out;
}

/** A new exercise for the session: last time's working sets, not done; else one empty set. */
export function newExercise(
  exerciseId: string,
  restS: number | null,
  base: readonly LiveSet[] | undefined,
): LiveExercise {
  const e: LiveExercise = { exerciseId, restS, notes: "", sets: [] };
  return {
    ...e,
    sets:
      base && base.length
        ? base.map((s) => ({ ...s, warmup: false, done: false }))
        : [copyLastSet(e)],
  };
}

/** A stored set (repositories) as a live set. */
export function fromStoredSet(s: {
  reps: number | null;
  loadKg: string | null;
  loadText: string | null;
  loadApprox: boolean;
  durationS: number | null;
  distanceM: number | null;
  speedKmh: string | null;
  inclinePct: string | null;
  restS: number | null;
  warmup: boolean;
  done?: boolean;
}): LiveSet {
  return {
    reps: s.reps,
    loadKg: s.loadKg === null ? null : String(Number(s.loadKg)),
    loadText: s.loadText,
    loadApprox: s.loadApprox,
    durationS: s.durationS,
    distanceM: s.distanceM,
    speedKmh: s.speedKmh,
    inclinePct: s.inclinePct,
    restS: s.restS,
    warmup: s.warmup,
    done: s.done ?? true,
  };
}
