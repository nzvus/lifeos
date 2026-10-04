/**
 * app/(app)/training/routines/[id]/page.tsx — URL /training/routines/<id>:
 * a routine on the gym-mode screen, in routine mode (2026-10-04: one editor
 * instead of two): its exercises and sets as its next start would have them,
 * changed here and saved to the routine, or started now / planned today,
 * without anything being done or timed. Name and notes: ./details.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { idInput } from "@/core/nutrition/validation";
import { todayIn } from "@/core/shared/dates";
import { listRoutines } from "@/core/training/repositories/routines";
import { listSessions } from "@/core/training/repositories/sessions";
import { LiveSession } from "@/features/training/live/LiveSession";
import { TEXT_LINK } from "@/ui/button";
import { PageHeader } from "@/ui/PageHeader";
import {
  finishLiveAction,
  saveLiveAction,
  saveToRoutineAction,
  setUnilateralAction,
  startEditedAction,
} from "../../live-actions";
import { liveData, routineExercisesNow } from "../../live-data";

type Props = { params: Promise<{ id: string }> };

export default async function RoutinePage({ params }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const db = getDb();
  const today = todayIn(settings.timezone);
  const [routines, history, { info, baseline }] = await Promise.all([
    listRoutines(db, owner),
    listSessions(db, owner, "2000-01-01", today),
    liveData(owner, today, settings.locale, t.training),
  ]);
  const routine = routines.find((r) => r.id === id);
  if (!routine) notFound();
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-4">
      <PageHeader
        title={routine.name}
        back={{ href: "/training/routines", label: t.routines.back }}
      />
      <Link
        href={`/training/routines/${id}/details`}
        className={`self-start text-meta ${TEXT_LINK}`}
      >
        {t.routines.details}
      </Link>
      <LiveSession
        id={null}
        mode="routine"
        initial={{
          day: today,
          label: routine.name,
          time: "",
          routineId: routine.id,
          notes: "",
          exercises: routineExercisesNow(routine, history),
        }}
        startedAt={null}
        info={info}
        baseline={baseline}
        locale={settings.locale}
        save={saveLiveAction}
        finish={finishLiveAction}
        saveToRoutine={saveToRoutineAction}
        setUnilateral={setUnilateralAction}
        startEdited={startEditedAction}
        t={t.training.live}
        guides={t.guides}
      />
    </div>
  );
}
