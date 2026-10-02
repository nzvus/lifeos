/** Shared by the routine pages: my exercises for the picker. */
import { regionOf } from "@/core/training/anatomy";
import "server-only";
import type { Owner } from "@/core/identity/owner";
import { listExercises } from "@/core/training/repositories/exercises";
import { getDb } from "@/app/_server/runtime";

export async function routineExercises(owner: Owner) {
  return (await listExercises(getDb(), owner)).map((e) => ({
    id: e.id,
    name: e.name,
    kind: e.kind,
    // For the drawing next to each row (ui/ExerciseIcon).
    pattern: e.pattern,
    region: regionOf(e.muscleGroups),
  }));
}
