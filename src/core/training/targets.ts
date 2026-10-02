/**
 * core/training/targets.ts — what to aim for today on an exercise, from the
 * last time and its guide (ADR-0028). Pure; tested in targets.test.ts.
 *
 * Double progression (the usual method for hypertrophy and beginners):
 * keep the load and add reps until every working set reaches the top of
 * the range; then add one load step (core/training/live loadStep) and start
 * again from the bottom. Bodyweight moves by reps; planks and cardio by
 * time (+10 %, the usual cap on weekly increases). With no history, the
 * range and "a load you could lift 2–3 more times" (RIR 2–3).
 */
import type { Guide } from "./guides";
import { loadStep } from "./live";

export type LastSet = {
  reps: number | null;
  loadKg: string | null;
  durationS: number | null;
  warmup: boolean;
};

export type Target =
  | { reason: "start"; sets: number; reps: [number, number] }
  | {
      reason: "add_load" | "add_reps" | "hold";
      sets: number;
      reps: [number, number];
      /** Kg as text (exact), null for bodyweight. */
      loadKg: string | null;
    }
  | {
      reason: "add_time" | "hold_time";
      sets: number;
      minutes?: number;
      seconds?: number;
    };

/** The best set by estimated 1RM (Epley: kg × (1 + reps / 30)). */
export function bestSet(
  sets: readonly LastSet[],
): { reps: number; kg: number; e1rm: number } | null {
  let best: { reps: number; kg: number; e1rm: number } | null = null;
  for (const s of sets) {
    if (s.warmup || !s.reps || !s.loadKg) continue;
    const kg = Number(s.loadKg);
    const e1rm = Math.round(kg * (1 + s.reps / 30) * 10) / 10;
    if (!best || e1rm > best.e1rm) best = { reps: s.reps, kg, e1rm };
  }
  return best;
}

export function nextTarget(guide: Guide, last: readonly LastSet[] | undefined): Target {
  const work = (last ?? []).filter((s) => !s.warmup);
  const [lo, hi] = guide.reps;
  const sets = work.length || guide.sets[0];
  if (guide.progression === "time") {
    if (guide.role === "cardio") {
      const min = Math.round(work.reduce((a, s) => a + (s.durationS ?? 0), 0) / 60);
      if (!min) return { reason: "hold_time", sets: 1, minutes: lo };
      return {
        reason: "add_time",
        sets: 1,
        minutes: Math.min(hi * 2, Math.round(min * 1.1)),
      };
    }
    const sec = Math.max(...work.map((s) => s.durationS ?? 0), 0);
    if (!sec) return { reason: "hold_time", sets, seconds: lo };
    return { reason: "add_time", sets, seconds: Math.round(sec * 1.1) };
  }
  if (work.length === 0) return { reason: "start", sets, reps: [lo, hi] };
  // Sets at different loads: progress from the heaviest (its sets only).
  const loaded = work.filter((s) => s.loadKg !== null);
  const top = loaded.length ? Math.max(...loaded.map((s) => Number(s.loadKg))) : null;
  const atTop = top === null ? work : loaded.filter((s) => Number(s.loadKg) === top);
  const kg = top === null ? null : atTop[0]!.loadKg;
  const reps = atTop.map((s) => s.reps ?? 0);
  if (guide.progression === "reps" || kg === null) {
    // Bodyweight: one more rep on the weakest set, up to the top; at the
    // top on every set, a load or a harder variant (loadKg null: say so).
    if (reps.every((r) => r >= hi))
      return { reason: "add_load", sets, reps: [lo, hi], loadKg: null };
    const target = Math.min(hi, Math.min(...reps) + 1);
    return {
      reason: target > Math.min(...reps) ? "add_reps" : "hold",
      sets,
      reps: [target, hi],
      loadKg: null,
    };
  }
  const n = Number(kg);
  if (reps.every((r) => r >= hi)) {
    const up = Math.round((n + loadStep(n)) * 100) / 100;
    return { reason: "add_load", sets, reps: [lo, hi], loadKg: String(up) };
  }
  const weakest = Math.min(...reps);
  return {
    reason: weakest < lo ? "hold" : "add_reps",
    sets,
    reps: [Math.min(hi, Math.max(lo, weakest + 1)), hi],
    loadKg: kg,
  };
}
