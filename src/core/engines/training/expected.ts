/**
 * E6 Training — what a set should give, to judge it against (dossiers/
 * training.md §5.1, §5.5). Instead of v1's "% vs the same set last time":
 *   reps at a load   from the trend's e1RM, inverting Epley with the RIR
 *                    aimed at: 30 × (e1RM / kg − 1) − RIR
 *   the drop         reps lost per set at the same load, learnt per
 *                    exercise (median); the developer loses 0 in 47 of 82
 *                    exercises, 1–4 in the rest
 *   RIR aimed at     size first (the developer's goal, 2026-10-23): closer
 *                    to failure helps growth, strength is flat across RIR
 *                    (Robinson 2024) — compounds 1–3, isolation 0–2
 */
import { median } from "./stats";

export type EffortRole = "compound" | "isolation" | "core" | "cardio";
export const RIR_BAND: Record<EffortRole, [number, number]> = {
  compound: [1, 3],
  isolation: [0, 2],
  core: [0, 2],
  cardio: [0, 0],
};
/** The RIR a proposal aims at: the middle of the role's band. */
export function rirTarget(role: EffortRole): number {
  const [lo, hi] = RIR_BAND[role];
  return Math.round((lo + hi) / 2);
}

/** Reps left before failure at `kg` for an e1RM, less the RIR aimed at; never below 0. */
export function repsAt(e1rm: number, kg: number, rir: number): number {
  if (!(kg > 0) || !(e1rm > 0)) return 0;
  return Math.max(0, Math.floor(30 * (e1rm / kg - 1) - rir + 1e-9));
}

/**
 * Reps lost per set at the same load: in each session, the sets at its top
 * load in order, (first − last) ÷ (sets − 1); the median over sessions. 0
 * with no session of two sets or more at one load.
 */
export function learntDrop(
  sessions: readonly (readonly { reps: number | null; kg: number | null }[])[],
): number {
  const drops: number[] = [];
  for (const sets of sessions) {
    const loaded = sets.filter((s) => s.kg !== null && s.reps !== null);
    if (loaded.length < 2) continue;
    const top = Math.max(...loaded.map((s) => s.kg!));
    const at = loaded.filter((s) => s.kg === top);
    if (at.length < 2) continue;
    drops.push((at[0]!.reps! - at.at(-1)!.reps!) / (at.length - 1));
  }
  return drops.length ? Math.max(0, median(drops)) : 0;
}

/** The reps expected on set `index` (0 first) at `kg`. */
export function expectedReps(p: {
  e1rm: number;
  kg: number;
  rir: number;
  drop: number;
  index: number;
}): number {
  return Math.max(0, Math.round(repsAt(p.e1rm, p.kg, p.rir) - p.drop * p.index));
}

/** A done set against the expected: the difference in reps (within ±1 is "as expected"). */
export function vsExpected(
  done: number,
  expected: number,
): { diff: number; word: "above" | "as" | "below" } {
  const diff = done - expected;
  return { diff, word: diff > 1 ? "above" : diff < -1 ? "below" : "as" };
}

/**
 * Reps done at one load as reps at another (Epley both ways), to compare a
 * set with a proposal at a different load; the same reps when either load is
 * unknown or they are equal.
 */
export function repsAtLoad(reps: number, kg: number | null, atKg: number | null): number {
  if (kg === null || atKg === null || !(kg > 0) || !(atKg > 0) || kg === atKg)
    return reps;
  return Math.round(30 * ((kg * (1 + reps / 30)) / atKg - 1));
}
