/**
 * app/(app)/training/[id]/live/page.tsx — URL /training/<id>/live: the gym
 * mode of a planned session (features/training/live/LiveSession). A done
 * session opens in the editor instead.
 */
import { notFound, redirect } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, timeIn } from "@/core/shared/dates";
import { idInput } from "@/core/nutrition/validation";
import { fromStoredSet, type LiveSession as Live } from "@/core/training/live";
import { getSession } from "@/core/training/repositories/sessions";
import { LiveSession } from "@/features/training/live/LiveSession";
import { PageHeader } from "@/ui/PageHeader";
import {
  finishLiveAction,
  saveLiveAction,
  saveToRoutineAction,
  setUnilateralAction,
} from "../../live-actions";
import { liveData } from "../../live-data";

type Props = { params: Promise<{ id: string }> };

export default async function LivePage({ params }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const session = await getSession(getDb(), owner, id);
  if (!session) notFound();
  if (session.status === "done") redirect(`/training/${id}`);
  // Every exercise (the session's and any that can be added), and last
  // time's working sets: the "default" each set is compared with.
  const { info, baseline } = await liveData(
    owner,
    addDays(session.day, -1),
    settings.locale,
    t.training,
  );
  const initial: Live = {
    day: session.day,
    label: session.label,
    time: session.startedAt ? timeIn(new Date(session.startedAt), settings.timezone) : "",
    routineId: session.routineId,
    notes: session.notes,
    exercises: session.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      restS: e.restS,
      notes: e.notes,
      sets: e.sets.map(fromStoredSet),
    })),
  };
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-4">
      <PageHeader
        title={t.training.live.title}
        back={{ href: `/training/${id}`, label: t.training.live.editor }}
      />
      <LiveSession
        id={id}
        initial={initial}
        startedAt={session.startedAt}
        info={info}
        baseline={baseline}
        locale={settings.locale}
        save={saveLiveAction}
        finish={finishLiveAction}
        saveToRoutine={saveToRoutineAction}
        setUnilateral={setUnilateralAction}
        t={t.training.live}
        guides={t.guides}
      />
    </div>
  );
}
