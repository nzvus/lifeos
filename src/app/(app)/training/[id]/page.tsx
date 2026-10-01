/**
 * app/(app)/training/[id]/page.tsx — URL /training/<id>[?from=PATH]: edit or
 * delete a session; an estimated one (ADR-0016, no exercises) gets its own
 * editor (EstimateEditor).
 */
import { notFound } from "next/navigation";
import { Dumbbell, Trash2 } from "lucide-react";
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, timeIn } from "@/core/shared/dates";
import { idInput } from "@/core/nutrition/validation";
import { getSession } from "@/core/training/repositories/sessions";
import { EMPTY_SET, SessionEditor } from "@/features/training/sessions/SessionEditor";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import { PageHeader } from "@/ui/PageHeader";
import { safeFrom } from "@/core/shared/navigation";
import { EstimateEditor } from "@/features/training/sessions/EstimateForm";
import {
  deleteSessionAction,
  updateEstimateAction,
  updateSessionAction,
} from "../actions";
import { editorData } from "../editor-data";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function EditSessionPage({ params, searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const session = await getSession(getDb(), owner, id);
  if (!session) notFound();
  const from = safeFrom((await searchParams).from, "/training");
  const time = session.startedAt
    ? timeIn(new Date(session.startedAt), settings.timezone)
    : "";
  if (session.exercises.length === 0 && (session.intensity || session.kcalEstimate))
    return (
      <div className="flex max-w-page flex-col gap-8">
        <PageHeader
          title={session.label}
          back={{
            href: from,
            label: from === "/training" ? t.training.back : t.actions.back,
          }}
        />
        <EstimateEditor
          id={id}
          from={from}
          action={updateEstimateAction.bind(null, id)}
          initial={{
            day: session.day,
            time,
            label: session.label,
            status: session.status,
            durationMin: session.durationMin === null ? "" : String(session.durationMin),
            intensity: session.intensity ?? "",
            kcalEstimate:
              session.kcalEstimate === null ? "" : String(session.kcalEstimate),
            muscleGroups: session.muscleGroups.join(","),
            notes: session.notes,
          }}
          t={{
            training: t.training,
            exercises: t.exercises,
            errors: t.errors,
            actions: t.actions,
          }}
        />
        <ActionButtonForm
          action={deleteSessionAction.bind(null, id)}
          label={t.training.delete}
          icon={<Trash2 size={16} aria-hidden="true" />}
        />
      </div>
    );
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
      {session.status === "planned" && (
        <Link
          href={`/training/${id}/live`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-control bg-herb font-display text-item font-bold text-sheet"
        >
          <Dumbbell size={20} aria-hidden="true" />
          {t.training.live.open}
        </Link>
      )}
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
              done: s.done,
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
