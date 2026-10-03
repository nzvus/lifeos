/** app/(app)/training/programs/new/page.tsx — URL /training/programs/new. */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { todayIn } from "@/core/shared/dates";
import { listExercises } from "@/core/training/repositories/exercises";
import { listRoutines } from "@/core/training/repositories/routines";
import { lookOf } from "@/core/training/calendar";
import { ProgramEditor } from "@/features/training/programs/ProgramEditor";
import { PageHeader } from "@/ui/PageHeader";
import { createProgramAction } from "../actions";

export default async function NewProgramPage() {
  const { owner, settings, t } = await requireContext();
  const [routines, exercises] = await Promise.all([
    listRoutines(getDb(), owner),
    listExercises(getDb(), owner),
  ]);
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={t.programs.new}
        back={{ href: "/training/programs", label: t.programs.back }}
      />
      <ProgramEditor
        from="/training/programs"
        action={createProgramAction}
        routines={routines.map((r) => ({
          id: r.id,
          name: r.name,
          look: lookOf(r.items),
        }))}
        exercises={exercises.map((e) => ({
          id: e.id,
          name: e.name,
          look: lookOf([{ ...e, sets: 1 }]),
        }))}
        initial={{
          name: "",
          notes: "",
          startDay: todayIn(settings.timezone),
          active: true,
          // A start: the routines in their order, then a rest day.
          slots: [
            ...routines.map((r) => ({
              label: "",
              items: [{ routineId: r.id, exerciseId: null }],
            })),
            { label: t.programs.rest, items: [] },
          ],
        }}
        t={{ programs: t.programs, errors: t.errors, actions: t.actions }}
      />
    </div>
  );
}
