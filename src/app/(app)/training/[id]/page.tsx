/**
 * app/(app)/training/[id]/page.tsx — URL /training/<id>[?from=PATH]: edit a
 * session, or move it to the trash from the "⋯" menu (ADR-0015); an
 * estimated one (ADR-0016, no exercises) gets its own editor
 * (EstimateEditor). A planned session can open in gym mode.
 */
import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { idInput } from "@/core/nutrition/validation";
import { addDays, timeIn } from "@/core/shared/dates";
import { safeFrom } from "@/core/shared/navigation";
import { getSession } from "@/core/training/repositories/sessions";
import { EstimateEditor } from "@/features/training/sessions/EstimateForm";
import { EMPTY_SET, SessionEditor } from "@/features/training/sessions/SessionEditor";
import { PageHeader } from "@/ui/PageHeader";
import { TrashMenu } from "@/ui/TrashMenu";
import {
  deleteSessionAction,
  restoreSessionAction,
  updateEstimateAction,
  updateSessionAction,
} from "../actions";
import { editorData } from "../editor-data";
import { buttonClass } from "@/ui/button";

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
  const str = (v: number | string | null | undefined) =>
    v === null || v === undefined ? "" : String(typeof v === "string" ? Number(v) : v);
  const header = (title: string) => (
    <PageHeader
      title={title}
      back={{
        href: from,
        label: from === "/training" ? t.training.back : t.actions.back,
      }}
      menu={
        <TrashMenu
          id={id}
          from={from}
          name={session.label}
          trash={deleteSessionAction}
          restore={restoreSessionAction}
          labels={t.actions}
        />
      }
    />
  );

  if (session.exercises.length === 0 && (session.intensity || session.kcalEstimate))
    return (
      <div className="mx-auto flex w-full max-w-page flex-col gap-8">
        {header(session.label)}
        <EstimateEditor
          id={id}
          from={from}
          action={updateEstimateAction.bind(null, id)}
          initial={{
            day: session.day,
            time,
            label: session.label,
            status: session.status,
            durationMin: str(session.durationMin),
            intensity: session.intensity ?? "",
            kcalEstimate: str(session.kcalEstimate),
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
      </div>
    );

  const { exercises, last } = await editorData(
    owner,
    addDays(session.day, -1),
    settings.locale,
    t.training,
  );
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      {header(t.training.editTitle)}
      {session.status === "planned" && (
        <Link
          href={`/training/${id}/live`}
          className={buttonClass({ variant: "primary", block: true })}
        >
          <Dumbbell size={20} aria-hidden="true" />
          {t.training.live.open}
        </Link>
      )}
      <SessionEditor
        id={id}
        from={from}
        action={updateSessionAction.bind(null, id)}
        exercises={exercises}
        last={last}
        initial={{
          label: session.label,
          day: session.day,
          status: session.status,
          time,
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
        t={{
          training: t.training,
          errors: t.errors,
          search: t.search,
          actions: t.actions,
        }}
      />
    </div>
  );
}
