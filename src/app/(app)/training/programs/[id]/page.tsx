/** app/(app)/training/programs/[id]/page.tsx — URL /training/programs/<id>: edit a program. */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getProgram } from "@/core/training/repositories/programs";
import { listExercises } from "@/core/training/repositories/exercises";
import { listRoutines } from "@/core/training/repositories/routines";
import { lookOf } from "@/core/training/calendar";
import { ProgramEditor } from "@/features/training/programs/ProgramEditor";
import { PageHeader } from "@/ui/PageHeader";
import { updateProgramAction } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function ProgramPage({ params }: Props) {
  const { owner, t } = await requireContext();
  const { id } = await params;
  const db = getDb();
  const [program, routines, exercises] = await Promise.all([
    getProgram(db, owner, id),
    listRoutines(db, owner),
    listExercises(db, owner),
  ]);
  if (!program) notFound();
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={program.name}
        back={{ href: "/training/plan", label: t.programs.back }}
      />
      <ProgramEditor
        id={program.id}
        from="/training/plan"
        action={updateProgramAction.bind(null, program.id)}
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
          name: program.name,
          notes: program.notes,
          startDay: program.startDay,
          active: program.active,
          slots: program.slots.map((s) => ({
            label: s.label,
            items: s.items.map(({ routineId, exerciseId }) => ({
              routineId,
              exerciseId,
            })),
          })),
        }}
        t={{ programs: t.programs, errors: t.errors, actions: t.actions }}
      />
    </div>
  );
}
