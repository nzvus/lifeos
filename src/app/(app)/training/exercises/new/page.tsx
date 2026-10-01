/** app/(app)/training/exercises/new/page.tsx — URL /training/exercises/new[?from=PATH]. */
import { requireContext } from "@/app/_server/owner";
import { safeFrom } from "@/core/shared/navigation";
import { ExerciseForm } from "@/features/training/exercises/ExerciseForm";
import { PageHeader } from "@/ui/PageHeader";
import { createExerciseAction } from "../../actions";

type Props = { searchParams: Promise<{ from?: string }> };

export default async function NewExercisePage({ searchParams }: Props) {
  const { t } = await requireContext();
  const from = safeFrom((await searchParams).from, "/training/exercises");
  return (
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={t.exercises.new}
        back={{
          href: from,
          label: from === "/training/exercises" ? t.exercises.back : t.actions.back,
        }}
      />
      <ExerciseForm
        from={from}
        action={createExerciseAction}
        initial={{ kind: "strength" }}
        t={{
          exercises: t.exercises,
          training: t.training,
          errors: t.errors,
          actions: t.actions,
        }}
      />
    </div>
  );
}
