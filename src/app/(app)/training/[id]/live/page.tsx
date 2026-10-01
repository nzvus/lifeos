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
import { regionOf } from "@/core/training/anatomy";
import type { LiveSession as Live } from "@/core/training/live";
import { getSession } from "@/core/training/repositories/sessions";
import { LiveSession, type LiveExerciseInfo } from "@/features/training/live/LiveSession";
import { PageHeader } from "@/ui/PageHeader";
import { editorData } from "../../editor-data";
import { finishLiveAction, saveLiveAction } from "../../live-actions";
import { listExercises } from "@/core/training/repositories/exercises";

type Props = { params: Promise<{ id: string }> };

export default async function LivePage({ params }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const db = getDb();
  const session = await getSession(db, owner, id);
  if (!session) notFound();
  if (session.status === "done") redirect(`/training/${id}`);
  const [{ last }, exercises] = await Promise.all([
    editorData(owner, addDays(session.day, -1), settings.locale, t.training),
    listExercises(db, owner),
  ]);
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const info: Record<string, LiveExerciseInfo> = {};
  for (const e of session.exercises) {
    const x = byId.get(e.exerciseId);
    info[e.exerciseId] = {
      name: e.name,
      kind: e.kind,
      pattern: x?.pattern ?? null,
      region: x ? regionOf(x.muscleGroups) : null,
      last: last[e.exerciseId] ?? null,
    };
  }
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
      sets: e.sets.map((s) => ({
        reps: s.reps,
        loadKg: s.loadKg === null ? null : String(Number(s.loadKg)),
        loadText: s.loadText,
        loadApprox: s.loadApprox,
        durationS: s.durationS,
        distanceM: s.distanceM,
        speedKmh: s.speedKmh,
        inclinePct: s.inclinePct,
        restS: s.restS,
        warmup: s.warmup,
        done: s.done,
      })),
    })),
  };
  return (
    <div className="flex max-w-page flex-col gap-4">
      <PageHeader
        title={t.training.live.title}
        back={{ href: `/training/${id}`, label: t.training.live.editor }}
      />
      <LiveSession
        id={id}
        initial={initial}
        startedAt={session.startedAt}
        info={info}
        save={saveLiveAction}
        finish={finishLiveAction}
        t={t.training.live}
      />
    </div>
  );
}
