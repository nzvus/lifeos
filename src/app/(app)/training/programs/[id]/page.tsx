/** app/(app)/training/programs/[id]/page.tsx — URL /training/programs/<id>: edit a program. */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getProgram } from "@/core/training/repositories/programs";
import { listRoutines } from "@/core/training/repositories/routines";
import { ProgramEditor } from "@/features/training/programs/ProgramEditor";
import { PageHeader } from "@/ui/PageHeader";
import { updateProgramAction } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function ProgramPage({ params }: Props) {
  const { owner, t } = await requireContext();
  const { id } = await params;
  const db = getDb();
  const [program, routines] = await Promise.all([
    getProgram(db, owner, id),
    listRoutines(db, owner),
  ]);
  if (!program) notFound();
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={program.name}
        back={{ href: "/training/programs", label: t.programs.back }}
      />
      <ProgramEditor
        id={program.id}
        from="/training/programs"
        action={updateProgramAction.bind(null, program.id)}
        routines={routines.map(({ id: rid, name }) => ({ id: rid, name }))}
        initial={{
          name: program.name,
          notes: program.notes,
          startDay: program.startDay,
          active: program.active,
          slots: program.slots.map((s) => ({ routineId: s.routineId, label: s.label })),
        }}
        t={{ programs: t.programs, errors: t.errors, actions: t.actions }}
      />
    </div>
  );
}
