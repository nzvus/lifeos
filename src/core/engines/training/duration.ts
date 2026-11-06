/**
 * E6 Training — how long a session takes (dossiers/training.md §5.3), and
 * the person's own timing it is built from:
 *   seconds per rep    median of timed sets (the developer: 4.2 s)
 *   rest               median gap between working sets (78 s)
 *   after a warm-up    median gap after a warm-up set (57 s)
 *   transition         median gap from an exercise's last set to the next
 *                      exercise's first (86 s)
 * Each needs ≥ 5 measurements, else E6's defaults. A naive sum with these
 * was already within −8…+16 % (IQR) of the developer's logged minutes.
 */
import { median } from "./stats";

export type TimedSet = {
  reps: number | null;
  durationS: number | null;
  warmup: boolean;
  /** Epoch milliseconds, when timed. */
  startedAt: number | null;
  endedAt: number | null;
};

export type Timing = {
  secPerRep: number;
  restS: number;
  warmupRestS: number;
  transitionS: number;
  /** Which of them are the person's own. */
  learnt: {
    secPerRep: boolean;
    restS: boolean;
    warmupRestS: boolean;
    transitionS: boolean;
  };
};

export const DEFAULT_TIMING = {
  secPerRep: 3.5,
  restS: 90,
  warmupRestS: 45,
  transitionS: 90,
} as const;
const MIN = 5;
const MAX_GAP_S = 1200;

/** The person's timing from their sessions (each a list of exercises, each its sets in order). */
export function learnTiming(
  sessions: readonly (readonly (readonly TimedSet[])[])[],
): Timing {
  const spr: number[] = [];
  const rest: number[] = [];
  const warm: number[] = [];
  const trans: number[] = [];
  const gap = (a: TimedSet, b: TimedSet) =>
    a.endedAt !== null && b.startedAt !== null ? (b.startedAt - a.endedAt) / 1000 : null;
  for (const exercises of sessions) {
    exercises.forEach((sets, i) => {
      for (const s of sets)
        if (s.reps && s.startedAt !== null && s.endedAt !== null) {
          const sec = (s.endedAt - s.startedAt) / 1000;
          if (sec > 0 && sec < 600) spr.push(sec / s.reps);
        }
      for (let j = 1; j < sets.length; j++) {
        const g = gap(sets[j - 1]!, sets[j]!);
        if (g !== null && g >= 0 && g < MAX_GAP_S)
          (sets[j - 1]!.warmup ? warm : rest).push(g);
      }
      const next = exercises[i + 1];
      if (next?.length && sets.length) {
        const g = gap(sets.at(-1)!, next[0]!);
        if (g !== null && g >= 0 && g < MAX_GAP_S) trans.push(g);
      }
    });
  }
  const pick = (xs: number[], d: number) => (xs.length >= MIN ? median(xs) : d);
  return {
    secPerRep: pick(spr, DEFAULT_TIMING.secPerRep),
    restS: pick(rest, DEFAULT_TIMING.restS),
    warmupRestS: pick(warm, DEFAULT_TIMING.warmupRestS),
    transitionS: pick(trans, DEFAULT_TIMING.transitionS),
    learnt: {
      secPerRep: spr.length >= MIN,
      restS: rest.length >= MIN,
      warmupRestS: warm.length >= MIN,
      transitionS: trans.length >= MIN,
    },
  };
}

export type TimedExercise = {
  sets: readonly { reps: number | null; durationS: number | null; warmup: boolean }[];
  /** This exercise's own values, when it has them; else the person's. */
  secPerRep?: number | undefined;
  restS?: number | undefined;
  setupS?: number | undefined;
};

/** A session's expected seconds: sets, rests, warm-up rests and the changes between exercises. */
export function sessionSeconds(exercises: readonly TimedExercise[], t: Timing): number {
  let total = 0;
  const active = exercises.filter((e) => e.sets.length > 0);
  for (const e of active) {
    e.sets.forEach((s, j) => {
      total += s.durationS ?? (s.reps ?? 0) * (e.secPerRep ?? t.secPerRep);
      total += e.setupS ?? 0;
      if (j < e.sets.length - 1) total += s.warmup ? t.warmupRestS : (e.restS ?? t.restS);
    });
  }
  return Math.round(total + Math.max(0, active.length - 1) * t.transitionS);
}
