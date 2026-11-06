/**
 * Warm-up sets (E6; dossiers/session.md §5.1). An exercise gets a ramp when
 * its primary muscle group was not the primary group of an exercise already
 * done today — the person warms up the first exercise of a muscle group, not
 * every exercise (13/17 first exercises, 0/30 second and third, in the
 * export of 29 Oct). The ramp is the person's own when enough past ramps
 * exist (the median % of the first work set per step), else the evidence
 * default: a light set and one near the work load (Ribeiro 2020, 2021).
 * A later exercise for warmed muscles gets one approach set only when it is
 * much heavier than anything those muscles moved today. Pure.
 */
import { median } from "./stats";

export type RampStep = { pct: number; reps: number };
export type WarmupSet = { reps: number; loadKg: number };
export type RampSource = "learnt" | "default";

/** A light set, then one near the work load. */
export const DEFAULT_RAMP: readonly RampStep[] = [
  { pct: 0.5, reps: 8 },
  { pct: 0.8, reps: 3 },
];
/** Past ramps needed before the person's own is used. */
export const MIN_RAMPS = 5;
/** Heavier than this × the heaviest load already used on the same muscles: one approach set. */
export const APPROACH_OVER = 1.3;
const APPROACH: RampStep = { pct: 0.8, reps: 3 };

type PastSet = { warmup: boolean; loadKg: string | number | null; reps: number | null };

/**
 * The person's ramp from past exercise-sessions: the most common number of
 * warm-up sets, then the median % of the first work load and the median reps
 * of each step. Null with fewer than MIN_RAMPS ramps of that length.
 */
export function learnRamp(sessions: readonly (readonly PastSet[])[]): RampStep[] | null {
  const ramps: { pct: number; reps: number }[][] = [];
  for (const sets of sessions) {
    const work = sets.find((s) => !s.warmup && Number(s.loadKg) > 0);
    const warm = sets.filter((s) => s.warmup && Number(s.loadKg) > 0);
    if (!work || warm.length === 0) continue;
    const top = Number(work.loadKg);
    ramps.push(warm.map((s) => ({ pct: Number(s.loadKg) / top, reps: s.reps ?? 0 })));
  }
  const byLength = new Map<number, typeof ramps>();
  for (const r of ramps) byLength.set(r.length, [...(byLength.get(r.length) ?? []), r]);
  const best = [...byLength.values()].sort((a, b) => b.length - a.length)[0];
  if (!best || best.length < MIN_RAMPS) return null;
  return best[0]!.map((_, k) => ({
    pct: Math.round(median(best.map((r) => r[k]!.pct)) * 100) / 100,
    reps: Math.max(1, Math.round(median(best.map((r) => r[k]!.reps)))),
  }));
}

/** Does this exercise open a muscle group today? Its primary group against those done before it. */
export function opensGroup(
  primary: string | null,
  earlierPrimaries: ReadonlySet<string>,
): boolean {
  return primary !== null && !earlierPrimaries.has(primary);
}

/**
 * The warm-up sets before the first work set, lightest first. `heaviestToday`
 * is the heaviest load already used today on any of the exercise's muscle
 * groups (null when none): it decides the approach set of a later exercise.
 */
export function warmupSets(p: {
  workKg: number | null;
  step: number;
  ramp: readonly RampStep[];
  opens: boolean;
  heaviestToday: number | null;
}): WarmupSet[] {
  const { workKg, step } = p;
  if (workKg === null || !(workKg >= 2 * step)) return [];
  const steps = p.opens
    ? p.ramp
    : p.heaviestToday !== null && workKg > APPROACH_OVER * p.heaviestToday
      ? [APPROACH]
      : [];
  const out: WarmupSet[] = [];
  for (const s of steps) {
    const loadKg = Math.floor((workKg * s.pct) / step) * step;
    // Never empty, never the work load itself, never twice the same load.
    if (loadKg <= 0 || loadKg >= workKg || out.some((o) => o.loadKg === loadKg)) continue;
    out.push({ reps: s.reps, loadKg: Math.round(loadKg * 100) / 100 });
  }
  return out;
}
