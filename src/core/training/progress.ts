/**
 * core/training/progress.ts — training as progress (S07), pure, from the
 * sessions the repository returns (done ones only: a plan is not progress):
 *
 *   week       sessions, working sets, tonnage, minutes and burn of a week
 *              (Monday–Sunday), and sets per muscle group: a set counts 1
 *              for the exercise's main group and 0.5 for each other one
 *              (anatomy.ts setShares). The usual hypertrophy guideline is
 *              10–20 weekly sets per group (VOLUME_RANGE); it is a reference
 *              band, not a target the app enforces.
 *   routines   per routine: its runs (started from it, or labelled with its
 *              name, presets.ts), the last one, tonnage per run and the
 *              change against the run before.
 *   exercises  per exercise: best e1RM per session, the change over about
 *              four weeks, and the recent points for a sparkline.
 */
import { addDays } from "../shared/dates";
import {
  bestE1rm,
  burnRange,
  change,
  sessionTonnage,
  weightAt,
  type BurnRange,
  type SetLike,
} from "./analysis";
import { setShares, type MuscleGroup } from "./anatomy";
import type { ExerciseKind } from "./kinds";
import { labelFamily } from "./presets";

export const VOLUME_RANGE = { low: 10, high: 20 } as const;

/** How many recent points a sparkline shows. */
export const SPARK_POINTS = 8;

type Session = {
  id: string;
  day: string;
  label: string;
  status: string;
  durationMin: number | null;
  routineId: string | null;
  exercises: readonly {
    exerciseId: string;
    kind: ExerciseKind;
    muscleGroups: readonly string[];
    sets: readonly SetLike[];
  }[];
};

type Measurement = { day: string; weightKg: string | null };

const done = <S extends { status: string; day: string }>(sessions: readonly S[]) =>
  sessions.filter((s) => s.status === "done").sort((a, b) => a.day.localeCompare(b.day));

const workingSets = (sets: readonly SetLike[]) => sets.filter((s) => !s.warmup).length;

export type WeekSummary = {
  from: string;
  to: string;
  sessions: number;
  /** Working sets of strength and bodyweight exercises. */
  sets: number;
  tonnage: number;
  minutes: number;
  burn: BurnRange | null;
  /** Weighted sets per muscle group (only groups with sets). */
  byGroup: Map<MuscleGroup, number>;
};

/** The week starting `monday` (a "YYYY-MM-DD" Monday). */
export function weekSummary(
  sessions: readonly Session[],
  measurements: readonly Measurement[],
  monday: string,
): WeekSummary {
  const to = addDays(monday, 6);
  const week = done(sessions).filter((s) => s.day >= monday && s.day <= to);
  const byGroup = new Map<MuscleGroup, number>();
  let sets = 0;
  const ranges: BurnRange[] = [];
  for (const s of week) {
    for (const e of s.exercises) {
      if (e.kind === "cardio") continue;
      const n = workingSets(e.sets);
      sets += n;
      for (const [g, share] of setShares(e.muscleGroups))
        byGroup.set(g, (byGroup.get(g) ?? 0) + n * share);
    }
    const r = burnRange(s, weightAt(measurements, s.day));
    if (r) ranges.push(r);
  }
  return {
    from: monday,
    to,
    sessions: week.length,
    sets,
    tonnage: week.reduce((a, s) => a + sessionTonnage(s.exercises), 0),
    minutes: week.reduce((a, s) => a + (s.durationMin ?? 0), 0),
    burn: sumRanges(ranges),
    byGroup,
  };
}

/** Ranges add up end to end (low + low, high + high); none -> null. */
function sumRanges(ranges: readonly BurnRange[]): BurnRange | null {
  return ranges.length
    ? {
        low: ranges.reduce((a, r) => a + r.low, 0),
        high: ranges.reduce((a, r) => a + r.high, 0),
      }
    : null;
}

/**
 * A day's training burn (ADR-0005: a range): what the done sessions burned,
 * and where the day ends if the planned ones happen too (ADR-0009).
 */
export function dayBurn(
  sessions: readonly Session[],
  measurements: readonly Measurement[],
): { done: BurnRange | null; withPlanned: BurnRange | null } {
  const ranges = sessions.flatMap((s) => {
    const r = burnRange(s, weightAt(measurements, s.day));
    return r ? [{ r, done: s.status === "done" }] : [];
  });
  return {
    done: sumRanges(ranges.filter((x) => x.done).map((x) => x.r)),
    withPlanned: sumRanges(ranges.map((x) => x.r)),
  };
}

export type RoutineProgress = {
  id: string;
  name: string;
  runs: number;
  last: { day: string; sessionId: string; tonnage: number; sets: number } | null;
  /** Whole-percent tonnage change, last run against the one before. */
  change: number | null;
  /** Tonnage of the last runs, oldest first. */
  series: number[];
};

export function routineProgress(
  routines: readonly { id: string; name: string }[],
  sessions: readonly Session[],
): RoutineProgress[] {
  const history = done(sessions);
  return routines.map((r) => {
    const family = labelFamily(r.name).family;
    const runs = history.filter(
      (s) => s.routineId === r.id || labelFamily(s.label).family === family,
    );
    const tons = runs.map((s) => sessionTonnage(s.exercises));
    const last = runs.at(-1);
    return {
      id: r.id,
      name: r.name,
      runs: runs.length,
      last: last
        ? {
            day: last.day,
            sessionId: last.id,
            tonnage: tons.at(-1)!,
            sets: last.exercises
              .filter((e) => e.kind !== "cardio")
              .reduce((a, e) => a + workingSets(e.sets), 0),
          }
        : null,
      change: tons.length >= 2 ? change(tons.at(-2)!, tons.at(-1)!) : null,
      series: tons.slice(-SPARK_POINTS),
    };
  });
}

export type ExerciseTrend = {
  exerciseId: string;
  lastDay: string;
  sessions: number;
  /** Best e1RM of the last session with one. */
  e1rm: number | null;
  /** Whole-percent change against the best e1RM about 4 weeks earlier. */
  change: number | null;
  /** Best e1RM per session, oldest first (sessions without one left out). */
  series: number[];
};

/**
 * Exercises done in the sessions, most recent first. The "4 weeks ago"
 * reference is the last point at least 28 days before the latest one, else
 * the first point (a younger history compares with its start).
 */
export function exerciseTrends(sessions: readonly Session[]): ExerciseTrend[] {
  const points = new Map<string, { day: string; e1rm: number | null }[]>();
  for (const s of done(sessions))
    for (const e of s.exercises)
      points.set(e.exerciseId, [
        ...(points.get(e.exerciseId) ?? []),
        { day: s.day, e1rm: bestE1rm(e.sets) },
      ]);
  return [...points]
    .map(([exerciseId, ps]): ExerciseTrend => {
      const est = ps.filter((p): p is { day: string; e1rm: number } => p.e1rm !== null);
      const last = est.at(-1);
      const ref = last
        ? (est.filter((p) => p.day <= addDays(last.day, -28)).at(-1) ?? est[0])
        : undefined;
      return {
        exerciseId,
        lastDay: ps.at(-1)!.day,
        sessions: ps.length,
        e1rm: last?.e1rm ?? null,
        change: last && ref && ref !== last ? change(ref.e1rm, last.e1rm) : null,
        series: est.slice(-SPARK_POINTS).map((p) => p.e1rm),
      };
    })
    .sort((a, b) => b.lastDay.localeCompare(a.lastDay));
}
