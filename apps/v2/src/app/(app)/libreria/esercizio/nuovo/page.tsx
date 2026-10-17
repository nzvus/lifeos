/** «Nuovo esercizio» (V-07): `/libreria/esercizio/nuovo`. */
import { requireOwner } from "@/app/_server/owner";
import { ExerciseForm } from "@/features/library/ExerciseForm";
import { saveExercise } from "./actions";

export default async function NewExercisePage() {
  await requireOwner();
  return <ExerciseForm action={saveExercise} />;
}
