/** app/(app)/training/[id]/page.tsx — URL /training/<id>: edit or delete a session. */
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, timeIn } from "@/core/shared/dates";
import { idInput } from "@/core/nutrition/validation";
import { getSession } from "@/core/training/repositories/sessions";
import { EMPTY_SET, SessionEditor } from "@/features/training/sessions/SessionEditor";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import { PageHeader } from "@/ui/PageHeader";
import { deleteSessionAction, updateSessionAction } from "../actions";
import { editorData } from "../editor-data";

type Props = { params: Promise<{ id: string }> };

export default async function EditSessionPage({ params }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const session = await getSession(getDb(), owner, id);
  if (!session) notFound();
  const { exercises, last } = await editorData(
    owner,
    addDays(session.day, -1),
    settings.locale,
    t.training,
  );
  const str = (v: number | string | null | undefined) =>
    v === null || v === undefined ? "" : String(typeof v === "string" ? Number(v) : v);
  return (
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={t.training.editTitle}
        back={{ href: "/training", label: t.training.back }}
      />
      <SessionEditor
        action={updateSessionAction.bind(null, id)}
        exercises={exercises}
        last={last}
        initial={{
          label: session.label,
          day: session.day,
          status: session.status,
          time: session.startedAt
            ? timeIn(new Date(session.startedAt), settings.timezone)
            : "",
          durationMin: str(session.durationMin),
          notes: session.notes,
          routineId: session.routineId ?? "",
          exercises: session.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            restS: str(e.restS),
            notes: e.notes,
            sets: e.sets.map((s) => ({
              ...EMPTY_SET,
              reps: str(s.reps),
              loadKg: str(s.loadKg),
              loadText: s.loadText ?? "",
              loadApprox: s.loadApprox,
              warmup: s.warmup,
              minutes: s.durationS ? String(Math.round(s.durationS / 60)) : "",
              km: s.distanceM ? String(s.distanceM / 1000) : "",
              speedKmh: str(s.speedKmh),
              inclinePct: str(s.inclinePct),
            })),
          })),
        }}
        submitLabel={t.training.save}
        t={{ training: t.training, errors: t.errors, search: t.search }}
      />
      <ActionButtonForm
        action={deleteSessionAction.bind(null, id)}
        label={t.training.delete}
        icon={<Trash2 size={16} aria-hidden="true" />}
      />
    </div>
  );
}
