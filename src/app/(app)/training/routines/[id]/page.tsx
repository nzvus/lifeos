/** app/(app)/training/routines/[id]/page.tsx — URL /training/routines/<id>: edit or delete. */
import { Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { idInput } from "@/core/nutrition/validation";
import { listRoutines } from "@/core/training/repositories/routines";
import { RoutineEditor } from "@/features/training/routines/RoutineEditor";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import { PageHeader } from "@/ui/PageHeader";
import { deleteRoutineAction, updateRoutineAction } from "../../actions";
import { routineExercises } from "../routine-page-data";

type Props = { params: Promise<{ id: string }> };

export default async function EditRoutinePage({ params }: Props) {
  const { owner, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const routine = (await listRoutines(getDb(), owner)).find((r) => r.id === id);
  if (!routine) notFound();
  const str = (v: number | string | null) => (v === null ? "" : String(Number(v)));
  return (
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={routine.name}
        back={{ href: "/training/routines", label: t.routines.back }}
      />
      <RoutineEditor
        action={updateRoutineAction.bind(null, id)}
        exercises={await routineExercises(owner)}
        initial={{
          name: routine.name,
          notes: routine.notes,
          items: routine.items.map((it) => ({
            exerciseId: it.exerciseId,
            sets: String(it.sets),
            reps: str(it.reps),
            loadKg: str(it.loadKg),
            restS: str(it.restS),
          })),
        }}
        submitLabel={t.routines.save}
        t={{
          routines: t.routines,
          training: t.training,
          errors: t.errors,
          search: t.search,
        }}
      />
      <ActionButtonForm
        action={deleteRoutineAction.bind(null, id)}
        label={t.routines.delete}
        icon={<Trash2 size={16} aria-hidden="true" />}
      />
    </div>
  );
}
