/**
 * app/(app)/training/routines/[id]/page.tsx — URL /training/routines/<id>[?from=PATH]:
 * edit a routine; "⋯" moves it to the trash (ADR-0015).
 */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { idInput } from "@/core/nutrition/validation";
import { safeFrom } from "@/core/shared/navigation";
import { listRoutines } from "@/core/training/repositories/routines";
import { RoutineEditor } from "@/features/training/routines/RoutineEditor";
import { PageHeader } from "@/ui/PageHeader";
import { TrashMenu } from "@/ui/TrashMenu";
import {
  deleteRoutineAction,
  restoreRoutineAction,
  updateRoutineAction,
} from "../../actions";
import { routineExercises } from "../routine-page-data";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function EditRoutinePage({ params, searchParams }: Props) {
  const { owner, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const from = safeFrom((await searchParams).from, "/training/routines");
  const routine = (await listRoutines(getDb(), owner)).find((r) => r.id === id);
  if (!routine) notFound();
  const str = (v: number | string | null) => (v === null ? "" : String(Number(v)));
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={routine.name}
        back={{
          href: from,
          label: from === "/training/routines" ? t.routines.back : t.actions.back,
        }}
        menu={
          <TrashMenu
            id={id}
            from={from}
            name={routine.name}
            trash={deleteRoutineAction}
            restore={restoreRoutineAction}
            labels={t.actions}
          />
        }
      />
      <RoutineEditor
        id={id}
        from={from}
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
            minutes: it.durationS ? String(it.durationS / 60) : "",
            restS: str(it.restS),
          })),
        }}
        t={{
          routines: t.routines,
          training: t.training,
          errors: t.errors,
          search: t.search,
          actions: t.actions,
        }}
      />
    </div>
  );
}
