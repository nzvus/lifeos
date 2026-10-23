/**
 * E6 → E7 — a session's parts for the "session" scoring model (engines.md
 * E7; dossiers/training.md §5.3), each 0–1, null when it cannot be computed
 * (left out and named by `score`):
 *   progression  share of exercises done at least as proposed: their working
 *                sets' reps against the proposal, ±1 is "as proposed"; a set
 *                at another load is brought to the proposed one (Epley)
 *   volume       working sets done against those proposed: 90–120 % is
 *                full, falling to 0 half a plan beyond
 *   effort       share of exercises whose last working set's RIR is in the
 *                role's band (size first: compound 1–3, isolation 0–2)
 *   rests        share of measured rests within ±30 % of the planned one
 */
import { bandScore } from "../judgements";
import { repsAtLoad, RIR_BAND, vsExpected, type EffortRole } from "./expected";

export type ScoredExercise = {
  role: EffortRole;
  proposed: readonly { reps: number | null; loadKg?: string | null | undefined }[];
  done: readonly {
    reps: number | null;
    loadKg?: string | null | undefined;
    warmup: boolean;
    rir: number | null;
  }[];
  restS: number;
  /** Measured gaps between this exercise's working sets, in seconds. */
  rests: readonly number[];
};

export type SessionParts = {
  progression: number | null;
  volume: number | null;
  effort: number | null;
  rests: number | null;
};

const share = (xs: readonly boolean[]) =>
  xs.length ? xs.filter(Boolean).length / xs.length : null;

export function sessionParts(exercises: readonly ScoredExercise[]): SessionParts {
  const trained = exercises.filter((e) => e.done.some((d) => !d.warmup));
  const progressed = trained.flatMap((e) => {
    const work = e.done.filter((d) => !d.warmup);
    const diffs = work.flatMap((d, i) => {
      const p = e.proposed[i];
      if (d.reps === null || !p || p.reps === null) return [];
      const kg = (x: string | null | undefined) => (x == null ? null : Number(x));
      return [vsExpected(repsAtLoad(d.reps, kg(d.loadKg), kg(p.loadKg)), p.reps).diff];
    });
    if (diffs.length === 0) return [];
    return [diffs.reduce((a, b) => a + b, 0) / diffs.length >= -1];
  });
  const planned = exercises.reduce((n, e) => n + e.proposed.length, 0);
  const done = exercises.reduce((n, e) => n + e.done.filter((d) => !d.warmup).length, 0);
  const efforts = trained.flatMap((e) => {
    const rir = e.done.filter((d) => !d.warmup).at(-1)?.rir ?? null;
    if (rir === null) return [];
    const [lo, hi] = RIR_BAND[e.role];
    return [rir >= lo && rir <= hi];
  });
  const rests = exercises.flatMap((e) =>
    e.rests.map((r) => Math.abs(r - e.restS) <= 0.3 * e.restS),
  );
  return {
    progression: share(progressed),
    volume: planned > 0 ? bandScore(done / planned, { low: 0.9, high: 1.2 }, 0.5) : null,
    effort: share(efforts),
    rests: share(rests),
  };
}
