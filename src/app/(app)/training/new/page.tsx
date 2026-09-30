/**
 * app/(app)/training/new/page.tsx — URL /training/new[?routine=ID][&day=YYYY-MM-DD].
 * From a routine, the editor starts with its exercises, each prefilled with
 * the working sets of the last time (else the routine's defaults); a day in
 * the future starts as "planned".
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, isValidDay, todayIn } from "@/core/shared/dates";
import { listRoutines } from "@/core/training/repositories/routines";
import {
  EMPTY_SET,
  SessionEditor,
  type EditorSet,
} from "@/features/training/sessions/SessionEditor";
import { PageHeader } from "@/ui/PageHeader";
import { createSessionAction } from "../actions";
import { editorData } from "../editor-data";

type Props = { searchParams: Promise<{ routine?: string; day?: string }> };

export default async function NewSessionPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const params = await searchParams;
  const today = todayIn(settings.timezone);
  const day = params.day && isValidDay(params.day) ? params.day : today;
  const [{ exercises, last, previous }, routines] = await Promise.all([
    editorData(owner, addDays(day, -1), settings.locale, t.training),
    listRoutines(getDb(), owner),
  ]);
  const routine = routines.find((r) => r.id === params.routine);
  const toSet = (v: {
    reps: number | null;
    loadKg: string | null;
    loadText?: string | null;
    loadApprox?: boolean;
    durationS?: number | null;
    speedKmh?: string | null;
    inclinePct?: string | null;
  }): EditorSet => ({
    ...EMPTY_SET,
    reps: v.reps === null ? "" : String(v.reps),
    loadKg: v.loadKg === null ? "" : String(Number(v.loadKg)),
    loadText: v.loadText ?? "",
    loadApprox: v.loadApprox ?? false,
    minutes: v.durationS ? String(Math.round(v.durationS / 60)) : "",
    speedKmh: v.speedKmh ? String(Number(v.speedKmh)) : "",
    inclinePct: v.inclinePct ? String(Number(v.inclinePct)) : "",
  });
  const initialExercises = (routine?.items ?? []).map((it) => {
    const before = previous.get(it.exerciseId)?.sets.filter((s) => !s.warmup);
    return {
      exerciseId: it.exerciseId,
      restS: it.restS === null ? "" : String(it.restS),
      notes: "",
      sets: before?.length
        ? before.map(toSet)
        : Array.from({ length: it.sets }, () =>
            toSet({ reps: it.reps, loadKg: it.loadKg, durationS: it.durationS }),
          ),
    };
  });
  return (
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={t.training.newTitle}
        back={{ href: "/training", label: t.training.back }}
      />
      <SessionEditor
        action={createSessionAction}
        exercises={exercises}
        last={last}
        initial={{
          label: routine?.name ?? t.training.title,
          day,
          status: day > today ? "planned" : "done",
          time: "",
          durationMin: "",
          notes: "",
          routineId: routine?.id ?? "",
          exercises: initialExercises,
        }}
        submitLabel={t.training.save}
        t={{ training: t.training, errors: t.errors, search: t.search }}
      />
    </div>
  );
}
