/** app/(app)/training/routines/new/page.tsx — URL /training/routines/new. */
import { requireContext } from "@/app/_server/owner";
import { RoutineEditor } from "@/features/training/routines/RoutineEditor";
import { PageHeader } from "@/ui/PageHeader";
import { createRoutineAction } from "../../actions";
import { routineExercises } from "../routine-page-data";

export default async function NewRoutinePage() {
  const { owner, t } = await requireContext();
  return (
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={t.routines.new}
        back={{ href: "/training/routines", label: t.routines.back }}
      />
      <RoutineEditor
        action={createRoutineAction}
        exercises={await routineExercises(owner)}
        initial={{ name: "", notes: "", items: [] }}
        submitLabel={t.routines.create}
        t={{
          routines: t.routines,
          training: t.training,
          errors: t.errors,
          search: t.search,
        }}
      />
    </div>
  );
}
