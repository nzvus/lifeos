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
  /** ADR-0049: reps left in the tank (0–4, 4 = "4 or more"); null/absent = not said. */
  rir?: number | null;
  /** ISO instants: the set's start ("Go") and end (✓); saved with the set. */
  startedAt: string | null;
  endedAt: string | null;
  /**
   * One arm/leg at a time (an unilateral exercise): the first side's end and
   * the second side's start. Kept in the browser's draft only; the set
   * stores its start and end.
   */
  halfAt?: string | null;
  resumedAt?: string | null;
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
/** Rest after a warm-up set: short, it should not tire (seconds). */
export const WARMUP_REST_S = 60;

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
    ? { ...fresh(last), warmup: false }
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
        startedAt: null,
        endedAt: null,
      };
}

/** A set as planned again: not done, no times. */
export function fresh(s: LiveSet): LiveSet {
  // A copy starts with no effort said (ADR-0049): the reps left are this set's own.
  const { halfAt: _half, resumedAt: _resumed, rir: _rir, ...rest } = s;
  return { ...rest, done: false, startedAt: null, endedAt: null };
}

/** The usual warm-up ramp: share of the first working load × reps. */
export const WARMUP_RAMP = [
  { pct: 0.5, reps: 8 },
  { pct: 0.7, reps: 5 },
  { pct: 0.85, reps: 3 },
] as const;

/**
 * The next warm-up set, put just before the working sets (2026-10-04: "the
 * warm-up button adds sets coherent with the loads; pressed again, the
 * following warm-ups"): the ramp 50 % × 8, 70 % × 5, 85 % × 3 of the first
 * working set's load, rounded down to its step; past the ramp, another 85 %.
 * Without a load (bodyweight), half the working reps. Not done.
 */
export function warmupSet(e: LiveExercise): LiveSet {
  const work = e.sets.find((x) => !x.warmup) ?? e.sets[0];
  const kg = work?.loadKg ? Number(work.loadKg) : null;
  const n = e.sets.filter((x) => x.warmup).length;
  const step = WARMUP_RAMP[Math.min(n, WARMUP_RAMP.length - 1)]!;
  const base = { ...copyLastSet({ ...e, sets: [] }), warmup: true };
  if (kg === null)
    return { ...base, reps: work?.reps ? Math.max(1, Math.round(work.reps / 2)) : 10 };
  const raw = kg * step.pct;
  const inc = loadStep(raw);
  return { ...base, reps: step.reps, loadKg: String(Math.floor(raw / inc) * inc) };
}

/** The exercise with its next warm-up inserted after the existing ones. */
export function addWarmup(e: LiveExercise): LiveExercise {
  const n = e.sets.filter((x) => x.warmup).length;
  // Warm-ups go first, in the order they are added.
  const at = e.sets.findIndex((x) => !x.warmup);
  const i = at < 0 ? e.sets.length : Math.min(at, n);
  return { ...e, sets: [...e.sets.slice(0, i), warmupSet(e), ...e.sets.slice(i)] };
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
  return toSessionValues(
    { ...s, exercises },
    "done",
    activeMinutes(s) ?? minutesSince(s.time, now),
  );
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
        ? base.map((s) => ({ ...fresh(s), warmup: false }))
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
  rir?: number | null;
  startedAt?: Date | string | null;
  endedAt?: Date | string | null;
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
    rir: s.rir ?? null,
    startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : null,
    endedAt: s.endedAt ? new Date(s.endedAt).toISOString() : null,
  };
}

// ---- the clock (2026-10-04) ------------------------------------------------
//
// rest  →  (the countdown passes zero and keeps counting, "+0:12")  →  Go
//       →  set (counts up)  →  ✓  →  rest …
// One arm/leg at a time: set (first side) → ✓ → half the rest → Go → set
// (second side) → ✓ → the rest. Everything is derived from the sets' saved
// instants, so a closed app or a reload resumes where it was, and the time
// away simply counts as rest.

export type Clock =
  | { phase: "idle" }
  | { phase: "set"; since: string; exercise: number; set: number; side: 1 | 2 }
  | { phase: "rest"; since: string; restS: number; half: boolean };

/** The rest planned after a set: warm-ups short; the first side of a set half. */
export function restAfter(e: LiveExercise, set: LiveSet, half: boolean): number {
  const full = set.warmup ? WARMUP_REST_S : (e.restS ?? DEFAULT_REST_S);
  return half ? Math.round(full / 2) : full;
}

const later = (a: string | null | undefined, b: string | null | undefined) =>
  !a ? (b ?? null) : !b ? a : a > b ? a : b;

/** Where the session is now, from its sets' instants. */
export function clockOf(s: LiveSession): Clock {
  let last: { at: string; restS: number; half: boolean } | null = null;
  for (const [ei, e] of s.exercises.entries())
    for (const [si, x] of e.sets.entries()) {
      // Between the sides of a set it is a rest (below), not the set.
      if (x.startedAt && !x.endedAt && !x.done && !(x.halfAt && !x.resumedAt)) {
        return {
          phase: "set",
          since: x.resumedAt ?? x.startedAt,
          exercise: ei,
          set: si,
          side: x.resumedAt ? 2 : 1,
        };
      }
      const ends: [string | null | undefined, boolean][] = [
        // An unticked set keeps its times (a misclick undone) but ends nothing.
        [x.done ? x.endedAt : null, false],
        [x.halfAt && !x.resumedAt ? x.halfAt : null, true],
      ];
      for (const [at, half] of ends)
        if (at && (!last || at > last.at))
          last = { at, restS: restAfter(e, x, half), half };
    }
  return last
    ? { phase: "rest", since: last.at, restS: last.restS, half: last.half }
    : { phase: "idle" };
}

/** "Go": the next set (or the second side of the current one) starts now. */
export function startNext(s: LiveSession, now: string): LiveSession {
  const pending = s.exercises
    .flatMap((e, ei) => e.sets.map((x, si) => ({ x, ei, si })))
    .find(({ x }) => x.halfAt && !x.resumedAt && !x.done);
  const target =
    pending ??
    (() => {
      const n = nextSet(s.exercises);
      return n ? { ei: n.exercise, si: n.set } : null;
    })();
  if (!target) return s;
  return mapSet(s, target.ei, target.si, (x) =>
    pending ? { ...x, resumedAt: now } : { ...x, startedAt: now, endedAt: null },
  );
}

/**
 * ✓ on the running set: one side done (an unilateral exercise's first side:
 * the half rest starts), or the whole set done.
 */
export function completeRunning(
  s: LiveSession,
  now: string,
  unilateral: (exerciseId: string) => boolean,
): LiveSession {
  const c = clockOf(s);
  if (c.phase !== "set") return s;
  const e = s.exercises[c.exercise]!;
  if (c.side === 1 && unilateral(e.exerciseId))
    return mapSet(s, c.exercise, c.set, (x) => ({ ...x, halfAt: now }));
  return mapSet(s, c.exercise, c.set, (x) => ({ ...x, endedAt: now, done: true }));
}

/** Ticks this close together are catching up, not sets just finished. */
export const CATCH_UP_MS = 20_000;

/**
 * The round tick on a set, by hand (2026-10-11):
 * - undone keeps its times, so ticking it again after a misclick gives them
 *   back instead of a new end "now";
 * - done ends now, unless another set was ticked by hand in the last 20 s
 *   without being timed: then it is catching up (the app opened mid-
 *   session) and its times are unknown, not invented.
 */
export function toggleDone(
  s: LiveSession,
  ei: number,
  si: number,
  now: string,
): LiveSession {
  const t = Date.parse(now);
  const catchingUp = s.exercises.some((e) =>
    e.sets.some(
      (x) =>
        x.done &&
        !x.startedAt &&
        x.endedAt &&
        t - Date.parse(x.endedAt) >= 0 &&
        t - Date.parse(x.endedAt) < CATCH_UP_MS,
    ),
  );
  return mapSet(s, ei, si, (x) =>
    x.done
      ? { ...x, done: false }
      : {
          ...x,
          done: true,
          endedAt: x.endedAt ?? (catchingUp && !x.startedAt ? null : now),
        },
  );
}

function mapSet(
  s: LiveSession,
  ei: number,
  si: number,
  f: (x: LiveSet) => LiveSet,
): LiveSession {
  return {
    ...s,
    exercises: s.exercises.map((e, i) =>
      i === ei ? { ...e, sets: e.sets.map((x, j) => (j === si ? f(x) : x)) } : e,
    ),
  };
}

/** Whole minutes from the first set's start to the last set's end; null without times. */
export function activeMinutes(s: LiveSession): number | null {
  let first: string | null = null;
  let last: string | null = null;
  for (const e of s.exercises)
    for (const x of e.sets) {
      if (x.startedAt && (!first || x.startedAt < first)) first = x.startedAt;
      last = later(last, x.done ? x.endedAt : null);
    }
  if (!first || !last || last <= first) return null;
  return Math.min(
    999,
    Math.max(1, Math.round((Date.parse(last) - Date.parse(first)) / 60000)),
  );
}

/**
 * The session's times, for the summary: time in sets, time resting, the
 * average rest, and the long breaks (more than 3× the planned rest and over
 * 10 minutes: the app was closed, or a phone call) — which make the session
 * less comparable.
 */
export function timing(s: LiveSession): {
  workS: number;
  restS: number;
  sets: number;
  avgRestS: number | null;
  longBreaks: number[];
} {
  const done = s.exercises.flatMap((e) =>
    e.sets
      .filter((x) => x.done && x.startedAt && x.endedAt)
      .map((x) => ({
        e,
        x,
        start: Date.parse(x.startedAt!),
        end: Date.parse(x.endedAt!),
      })),
  );
  done.sort((a, b) => a.start - b.start);
  let workS = 0;
  let restS = 0;
  const longBreaks: number[] = [];
  done.forEach((d, i) => {
    workS += Math.max(0, (d.end - d.start) / 1000);
    const prev = done[i - 1];
    if (!prev) return;
    const gap = Math.max(0, (d.start - prev.end) / 1000);
    restS += gap;
    const planned = restAfter(prev.e, prev.x, false);
    if (gap > Math.max(600, planned * 3)) longBreaks.push(Math.round(gap));
  });
  const gaps = Math.max(0, done.length - 1);
  return {
    workS: Math.round(workS),
    restS: Math.round(restS),
    sets: done.length,
    avgRestS: gaps ? Math.round(restS / gaps) : null,
    longBreaks,
  };
}

/**
 * The session's exercises as a routine's items ("Save to the routine"): per
 * exercise its working sets' count, the first working set's reps, load and
 * duration, and its rest. A routine holds one value per exercise, so a
 * pyramid is kept as its first set.
 */
export function routineItemsOf(s: LiveSession): {
  exerciseId: string;
  sets: number;
  reps: number | null;
  loadKg: string;
  durationS: number | null;
  restS: number | null;
}[] {
  return s.exercises.flatMap((e) => {
    const work = e.sets.filter((x) => !x.warmup);
    const first = work[0];
    if (!first) return [];
    return [
      {
        exerciseId: e.exerciseId,
        sets: Math.min(20, work.length),
        reps: first.reps,
        loadKg: first.loadKg ?? "",
        durationS: first.durationS,
        restS: e.restS,
      },
    ];
  });
}
