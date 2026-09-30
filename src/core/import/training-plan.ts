/**
 * core/import/training-plan.ts — what every training source is turned into
 * before it is written (ADR-0005): sessions of named exercises with sets,
 * routines, measurements. The gym-log parser and the FitForge reader both
 * produce these; ./training-apply.ts writes them through the repositories
 * (same validation as the forms).
 */
import type { ExerciseKind } from "../training/kinds";

export type PlannedSet = {
  reps: number | null;
  loadKg: string | null;
  loadText: string | null;
  loadApprox: boolean;
  durationS: number | null;
  speedKmh: string | null;
  inclinePct: string | null;
};
export type PlannedExercise = {
  name: string;
  notes: string;
  restS: number | null;
  sets: PlannedSet[];
};
export type PlannedSession = {
  label: string;
  day: string;
  /** "HH:MM" in the user's zone, or null when unknown. */
  time: string | null;
  durationMin: number | null;
  notes: string;
  exercises: PlannedExercise[];
};
export type PlannedRoutine = {
  name: string;
  items: {
    name: string;
    sets: number;
    reps: number | null;
    loadKg: string | null;
    restS: number | null;
  }[];
};
export type PlannedMeasurement = {
  day: string;
  weightKg: string;
  bodyFatPct: string | null;
  waistCm: string | null;
  notes: string;
};

export const plainSet = (v: Partial<PlannedSet>): PlannedSet => ({
  reps: null,
  loadKg: null,
  loadText: null,
  loadApprox: false,
  durationS: null,
  speedKmh: null,
  inclinePct: null,
  ...v,
});

/** An exercise's kind from its sets: any duration → cardio, any load → strength. */
export function kindOf(sets: readonly PlannedSet[]): ExerciseKind {
  if (sets.some((s) => s.durationS !== null)) return "cardio";
  if (sets.some((s) => s.loadKg !== null)) return "strength";
  return "bodyweight";
}
