/**
 * app/(app)/training/new/page.tsx — URL /training/new[?routine=ID][&day=YYYY-MM-DD].
 * From a routine, the editor starts with its exercises, each prefilled with
 * the working sets of the last time (else the routine's defaults); a day in
 * the future starts as "planned".
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
import { PageHeader } from "@/ui/PageHeader";
import { createSessionAction } from "../actions";
import { editorData } from "../editor-data";

type Props = { searchParams: Promise<{ routine?: string; day?: string }> };

export default async function NewSessionPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const params = await searchParams;
  const today = todayIn(settings.timezone);
  const day = params.day && isValidDay(params.day) ? params.day : today;
  const [{ exercises, last }, routines, history] = await Promise.all([
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
  const initialExercises = (preset?.exercises ?? []).map((e) => ({
    exerciseId: e.exerciseId,
    restS: e.restS === null ? "" : String(e.restS),
    notes: "",
    sets: e.sets.map(toSet),
  }));
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
          label: preset?.label ?? t.training.title,
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
