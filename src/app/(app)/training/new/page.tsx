/**
 * app/(app)/training/new/page.tsx — URL /training/new[?routine=ID | ?exercise=ID][&day=YYYY-MM-DD].
 * From a routine, the editor starts with its exercises, each prefilled with
 * the working sets of the last time (else the routine's defaults); from one
 * exercise (the day page's "Add training · Exercise", ADR-0016), that
 * exercise with its sets of last time. A day in the future starts as
 * "planned".
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, isValidDay, todayIn } from "@/core/shared/dates";
import { latestPreset, type PresetSet } from "@/core/training/presets";
import { listRoutines } from "@/core/training/repositories/routines";
import { listSessions } from "@/core/training/repositories/sessions";
import {
  EMPTY_SET,
  SessionEditor,
  type EditorSet,
} from "@/features/training/sessions/SessionEditor";
import { safeFrom } from "@/core/shared/navigation";
import { PageHeader } from "@/ui/PageHeader";
import { createSessionAction } from "../actions";
import { editorData } from "../editor-data";

type Props = {
  searchParams: Promise<{
    routine?: string;
    exercise?: string;
    day?: string;
    from?: string;
  }>;
};

export default async function NewSessionPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const params = await searchParams;
  const today = todayIn(settings.timezone);
  const day = params.day && isValidDay(params.day) ? params.day : today;
  const from = safeFrom(params.from, "/training");
  const [{ exercises, last, previous }, routines, history] = await Promise.all([
    editorData(owner, addDays(day, -1), settings.locale, t.training),
    listRoutines(getDb(), owner),
    listSessions(getDb(), owner, "2000-01-01", day),
  ]);
  const routine = routines.find((r) => r.id === params.routine);
  const toSet = (v: PresetSet): EditorSet => ({
    ...EMPTY_SET,
    reps: v.reps === null ? "" : String(v.reps),
    loadKg: v.loadKg === null ? "" : String(Number(v.loadKg)),
    loadText: v.loadText ?? "",
    loadApprox: v.loadApprox ?? false,
    minutes: v.durationS ? String(Math.round(v.durationS / 60)) : "",
    km: v.distanceM ? String(v.distanceM / 1000) : "",
    speedKmh: v.speedKmh ? String(Number(v.speedKmh)) : "",
    inclinePct: v.inclinePct ? String(Number(v.inclinePct)) : "",
  });
  const preset = routine
    ? latestPreset<PresetSet>(routine, history, (it) => ({ ...it, warmup: false }))
    : null;
  const single = exercises.find((e) => e.id === params.exercise);
  const initialExercises = single
    ? [
        {
          exerciseId: single.id,
          restS: "",
          notes: "",
          sets: (previous.get(single.id)?.sets.filter((x) => !x.warmup) ?? []).map((x) =>
            toSet({ ...x, warmup: false }),
          ),
        },
      ]
    : (preset?.exercises ?? []).map((e) => ({
        exerciseId: e.exerciseId,
        restS: e.restS === null ? "" : String(e.restS),
        notes: "",
        sets: e.sets.map(toSet),
      }));
  if (single && initialExercises[0]!.sets.length === 0)
    initialExercises[0]!.sets.push(EMPTY_SET);
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={t.training.newTitle}
        back={{
          href: from,
          label: from === "/training" ? t.training.back : t.actions.back,
        }}
      />
      <SessionEditor
        from={from}
        action={createSessionAction}
        exercises={exercises}
        last={last}
        initial={{
          label: single?.name ?? preset?.label ?? t.training.title,
          day,
          status: day > today ? "planned" : "done",
          time: "",
          durationMin: "",
          notes: "",
          routineId: routine?.id ?? "",
          exercises: initialExercises,
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
