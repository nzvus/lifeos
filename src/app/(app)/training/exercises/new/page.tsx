/** app/(app)/training/exercises/new/page.tsx — URL /training/exercises/new. */
import { requireContext } from "@/app/_server/owner";
import { ExerciseForm } from "@/features/training/exercises/ExerciseForm";
import { PageHeader } from "@/ui/PageHeader";
import { createExerciseAction } from "../../actions";

export default async function NewExercisePage() {
  const { t } = await requireContext();
  return (
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={t.exercises.new}
        back={{ href: "/training/exercises", label: t.exercises.back }}
      />
      <ExerciseForm
        action={createExerciseAction}
        initial={{ kind: "strength" }}
        submitLabel={t.exercises.create}
        t={{ exercises: t.exercises, training: t.training, errors: t.errors }}
      />
    </div>
  );
}
