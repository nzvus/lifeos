/**
 * core/training/analysis.ts — what a session says (ADR-0005), pure:
 *
 *   tonnage      Σ reps × load over working sets, as the developer counts
 *                by hand: "da 14" = 14, "con 2 da 20" = 40 (two
 *                dumbbells), warm-ups and approximate loads ("+ asta", a
 *                bar of unknown weight) left out — PUSH 1 (2026-09-11) =
 *                4 722 kg and PULL 1 (2026-09-15) = 4 080 kg, tested
 *   e1RM         Epley, load × (1 + reps / 30), only for 1–12 reps (beyond
 *                that it's not a strength estimate)
 *   comparison   tonnage and best e1RM against the previous time
 *   records      heaviest load and best e1RM per exercise, with the day
 *   burn         a RANGE of kcal (PROJECT.md: never a precise number):
 *                MET × body weight × hours; strength and bodyweight time at
 *                3.5–6 MET (Compendium of Physical Activities, resistance
 *                training light–vigorous); cardio from speed and incline
 *                with the ACSM walking/running equations, ±15 %; outdoors,
 *                the speed comes from distance ÷ time
 */
import type { ExerciseKind } from "./kinds";

export type SetLike = {
  reps: number | null;
  loadKg: string | null;
  warmup: boolean;
  /** Part of the load is unknown (a bar): kept, but not in tonnage. */
  loadApprox?: boolean;
  durationS?: number | null;
  distanceM?: number | null;
  speedKmh?: string | null;
  inclinePct?: string | null;
};

const working = (sets: readonly SetLike[]) => sets.filter((s) => !s.warmup);

/** Σ reps × load of the working sets with a known load. */
export function tonnage(sets: readonly SetLike[]): number {
  return working(sets)
    .filter((s) => !s.loadApprox)
    .reduce((sum, s) => sum + (s.reps ?? 0) * Number(s.loadKg ?? 0), 0);
}

/** Estimated one-rep max (Epley); null outside 1–12 reps or without a load. */
export function e1rm(reps: number | null, loadKg: string | null): number | null {
  if (reps === null || reps < 1 || reps > 12 || loadKg === null || Number(loadKg) <= 0)
    return null;
  return Number(loadKg) * (1 + reps / 30);
}

/** The best e1RM among working sets, or null. */
export function bestE1rm(sets: readonly SetLike[]): number | null {
  const values = working(sets)
    .map((s) => e1rm(s.reps, s.loadKg))
    .filter((v): v is number => v !== null);
  return values.length ? Math.max(...values) : null;
}

/** Whole-percent change, null when there is nothing to compare with. */
export function change(before: number | null, after: number | null): number | null {
  if (before === null || after === null || before === 0) return null;
  return Math.round(((after - before) / before) * 100);
}

export type ExerciseRecord = {
  maxLoad: { kg: number; day: string } | null;
  bestE1rm: { kg: number; day: string } | null;
};

/** Records per exercise over sessions (oldest first): the first day a record was set wins ties. */
export function records(
  history: readonly {
    day: string;
    exercises: readonly { exerciseId: string; sets: readonly SetLike[] }[];
  }[],
): Map<string, ExerciseRecord> {
  const out = new Map<string, ExerciseRecord>();
  for (const s of history)
    for (const e of s.exercises) {
      const r = out.get(e.exerciseId) ?? { maxLoad: null, bestE1rm: null };
      for (const set of working(e.sets)) {
        const load = Number(set.loadKg ?? 0);
        if (load > 0 && (r.maxLoad === null || load > r.maxLoad.kg))
          r.maxLoad = { kg: load, day: s.day };
        const est = e1rm(set.reps, set.loadKg);
        if (est !== null && (r.bestE1rm === null || est > r.bestE1rm.kg))
          r.bestE1rm = { kg: est, day: s.day };
      }
      out.set(e.exerciseId, r);
    }
  return out;
}

/** MET of walking or running at a speed and incline (ACSM metabolic equations). */
export function cardioMet(speedKmh: number, inclinePct: number): number {
  const mPerMin = (speedKmh * 1000) / 60;
  const grade = inclinePct / 100;
  // Walking up to ~6.5 km/h, running above (the ACSM equations' own ranges).
  const vo2 =
    speedKmh <= 6.5
      ? 0.1 * mPerMin + 1.8 * mPerMin * grade + 3.5
      : 0.2 * mPerMin + 0.9 * mPerMin * grade + 3.5;
  return vo2 / 3.5;
}

export type BurnRange = { low: number; high: number };

/**
 * Estimated kcal range of a session. Cardio sets with a speed use their own
 * MET (±15 %); the rest of the session's minutes count as strength time at
 * 3.5–6 MET. Without a body weight, or without any time, there is no
 * estimate (null) — never a guessed number.
 */
export function burnRange(
  session: {
    durationMin: number | null;
    exercises: readonly { kind: ExerciseKind; sets: readonly SetLike[] }[];
  },
  weightKg: string | null,
): BurnRange | null {
  if (weightKg === null) return null;
  const kg = Number(weightKg);
  let cardioMin = 0;
  let low = 0;
  let high = 0;
  for (const e of session.exercises) {
    if (e.kind !== "cardio") continue;
    for (const s of e.sets) {
      const min = (s.durationS ?? 0) / 60;
      if (min <= 0) continue;
      cardioMin += min;
      // Treadmill: the speed shown; outdoors: distance ÷ time.
      const speed = s.speedKmh
        ? Number(s.speedKmh)
        : s.distanceM
          ? s.distanceM / 1000 / (min / 60)
          : null;
      const met = speed ? cardioMet(speed, Number(s.inclinePct ?? 0)) : null;
      // Unknown speed: a broad walking-to-jogging band.
      low += (met ? met * 0.85 : 3.5) * kg * (min / 60);
      high += (met ? met * 1.15 : 7) * kg * (min / 60);
    }
  }
  const strengthMin = Math.max(0, (session.durationMin ?? 0) - cardioMin);
  low += 3.5 * kg * (strengthMin / 60);
  high += 6 * kg * (strengthMin / 60);
  if (low === 0 && high === 0) return null;
  return { low: Math.round(low), high: Math.round(high) };
}

/** A session's tonnage: Σ over its exercises (same rules as `tonnage`). */
export function sessionTonnage(
  exercises: readonly { sets: readonly SetLike[] }[],
): number {
  return exercises.reduce((sum, e) => sum + tonnage(e.sets), 0);
}

/**
 * The weight to use on a day: the latest measurement on or before it, else
 * the earliest one after it (better than no estimate), else null.
 * `measurements` in any order; weights as exact strings.
 */
export function weightAt(
  measurements: readonly { day: string; weightKg: string | null }[],
  day: string,
): string | null {
  const known = measurements
    .filter((m) => m.weightKg !== null)
    .sort((a, b) => a.day.localeCompare(b.day));
  const before = known.filter((m) => m.day <= day).at(-1);
  return (before ?? known[0])?.weightKg ?? null;
}

export type ExercisePoint = {
  day: string;
  sessionId: string;
  bestE1rm: number | null;
  tonnage: number;
  sets: readonly SetLike[];
};

/**
 * One exercise across sessions (oldest first): per DONE session, its best
 * e1RM, its tonnage and its sets — the progression of that exercise.
 */
export function exerciseHistory(
  sessions: readonly {
    id: string;
    day: string;
    status: string;
    exercises: readonly { exerciseId: string; sets: readonly SetLike[] }[];
  }[],
  exerciseId: string,
): ExercisePoint[] {
  return [...sessions]
    .filter((s) => s.status === "done")
    .sort((a, b) => a.day.localeCompare(b.day))
    .flatMap((s) =>
      s.exercises
        .filter((e) => e.exerciseId === exerciseId)
        .map((e) => ({
          day: s.day,
          sessionId: s.id,
          bestE1rm: bestE1rm(e.sets),
          tonnage: tonnage(e.sets),
          sets: e.sets,
        })),
    );
}

export type TrainingDay = {
  day: string;
  /** Done sessions that day. */
  sessions: number;
  tonnage: number;
  /** Σ of the sessions' ranges; null when none could be estimated. */
  burn: BurnRange | null;
};

/**
 * Training per day over `days` (the Targets page, next to intake): done
 * sessions only (a plan burns nothing), tonnage and estimated burn with the
 * weight of each day (`weightAt`). Days without training are present with
 * zeros, so charts line up with the nutrition history.
 */
export function trainingByDay(
  days: readonly string[],
  sessions: readonly {
    day: string;
    status: string;
    durationMin: number | null;
    exercises: readonly { kind: ExerciseKind; sets: readonly SetLike[] }[];
  }[],
  measurements: readonly { day: string; weightKg: string | null }[],
): TrainingDay[] {
  return days.map((day) => {
    const done = sessions.filter((s) => s.day === day && s.status === "done");
    const ranges = done
      .map((s) => burnRange(s, weightAt(measurements, day)))
      .filter((r): r is BurnRange => r !== null);
    return {
      day,
      sessions: done.length,
      tonnage: done.reduce((sum, s) => sum + sessionTonnage(s.exercises), 0),
      burn: ranges.length
        ? {
            low: ranges.reduce((a, r) => a + r.low, 0),
            high: ranges.reduce((a, r) => a + r.high, 0),
          }
        : null,
    };
  });
}
