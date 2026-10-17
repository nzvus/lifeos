/**
 * E6 Training — sets (engines.md E6): e1RM with effort, loads as typed,
 * and the flags asked before saving (listed in Review).
 */
import { median } from "./stats";

/**
 * e1RM with effort: load × (1 + (reps + RIR) / 30) (Epley with reps in reserve; Helms 2016).
 * Without RIR, Epley on the reps. Only 1–12 reps: beyond that the estimate is not useful.
 */
export function e1rm(reps: number, kg: number, rir?: number | null): number | null {
  if (!Number.isFinite(reps) || reps < 1 || reps > 12 || !(kg > 0)) return null;
  return kg * (1 + (reps + Math.max(0, rir ?? 0)) / 30);
}

/** How a load was typed. The stored load is always the total (03 T-10). */
export type TypedLoad = { kg: number; as: "total" | "perDumbbell" | "perSide" };

export function totalLoad(l: TypedLoad): number {
  return l.as === "total" ? l.kg : l.kg * 2;
}

export type SetForFlags = {
  exercise: string;
  /** Muscles the exercise trains directly (for the tonnage check). */
  muscles: readonly string[];
  reps: number;
  kg: number;
  rir?: number | null | undefined;
  warmup?: boolean | undefined;
};

export type Flag =
  | { type: "jump"; exercise: string; byPct: number }
  | { type: "implausibleReps"; exercise: string; reps: number; plausibleMax: number }
  | { type: "tonnage"; exercise: string; perSet: number; medianPerSet: number }
  | { type: "duplicate"; session: string; of: string };

/** A load or e1RM ≥ 60 % above the exercise's trend: "per dumbbell or total?" */
const JUMP = 0.6;
/** An exercise's tonnage per set > 3× the median per set of exercises for the same muscles. */
const TONNAGE = 3;

/**
 * Flags for a session's sets against each exercise's trend e1RM (E2 trend; absent for a new exercise).
 */
export function setFlags(
  sets: readonly SetForFlags[],
  trend: ReadonlyMap<string, number>,
): Flag[] {
  const flags: Flag[] = [];
  const work = sets.filter((s) => !s.warmup);
  for (const ex of new Set(work.map((s) => s.exercise))) {
    const mine = work.filter((s) => s.exercise === ex);
    const t = trend.get(ex);
    if (t === undefined || t <= 0) continue;
    const best = Math.max(...mine.map((s) => e1rm(s.reps, s.kg, s.rir) ?? s.kg));
    if (best >= t * (1 + JUMP))
      flags.push({ type: "jump", exercise: ex, byPct: Math.round((best / t - 1) * 100) });
    for (const s of mine) {
      if (s.kg <= 0 || s.kg >= t) continue;
      // The reps this load allows at failure, from the trend, with room for a good day.
      const atFailure = 30 * (t / s.kg - 1);
      const plausibleMax = Math.round(atFailure * 1.5 + 3);
      if (s.reps > plausibleMax) {
        flags.push({ type: "implausibleReps", exercise: ex, reps: s.reps, plausibleMax });
        break;
      }
    }
  }
  const perSet = new Map<string, number>();
  for (const ex of new Set(work.map((s) => s.exercise))) {
    const mine = work.filter((s) => s.exercise === ex);
    perSet.set(ex, mine.reduce((a, s) => a + s.kg * s.reps, 0) / mine.length);
  }
  for (const ex of perSet.keys()) {
    const muscles = work.find((s) => s.exercise === ex)!.muscles;
    const peers = [...perSet.keys()].filter(
      (o) =>
        o !== ex &&
        work.find((s) => s.exercise === o)!.muscles.some((m) => muscles.includes(m)),
    );
    if (peers.length < 2) continue;
    const m = median(peers.map((o) => perSet.get(o)!));
    if (m > 0 && perSet.get(ex)! > TONNAGE * m)
      flags.push({
        type: "tonnage",
        exercise: ex,
        perSet: Math.round(perSet.get(ex)!),
        medianPerSet: Math.round(m),
      });
  }
  return flags;
}

export type SessionKey = {
  id: string;
  day: string;
  routine: string | null;
  sets: readonly { exercise: string; reps: number; kg: number }[];
};

/** Sessions on the same day, from the same routine, with the same sets: the later one is flagged. */
export function duplicateSessions(sessions: readonly SessionKey[]): Flag[] {
  const seen = new Map<string, string>();
  const flags: Flag[] = [];
  for (const s of sessions) {
    const key = JSON.stringify([
      s.day,
      s.routine,
      s.sets.map((x) => [x.exercise, x.reps, x.kg]),
    ]);
    const first = seen.get(key);
    if (first) flags.push({ type: "duplicate", session: s.id, of: first });
    else seen.set(key, s.id);
  }
  return flags;
}
