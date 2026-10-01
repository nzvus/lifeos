/**
 * app/(app)/training/exercises/[id]/page.tsx — URL /training/exercises/<id>:
 * the exercise's progression (estimated 1RM per session), its history,
 * editing, merging into another exercise, deleting when unused.
 */
import { Trash2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { isMuscleGroup } from "@/core/training/anatomy";
import { getDb } from "@/app/_server/runtime";
import { idInput } from "@/core/nutrition/validation";
import { exerciseHistory } from "@/core/training/analysis";
import { setsText } from "@/core/training/display";
import { formatNumber } from "@/core/shared/format";
import { listExercises } from "@/core/training/repositories/exercises";
import { listSessions } from "@/core/training/repositories/sessions";
import { ExerciseForm } from "@/features/training/exercises/ExerciseForm";
import { MergeForm } from "@/features/training/exercises/MergeForm";
import { ProgressChart } from "@/features/training/exercises/ProgressChart";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import {
  deleteExerciseAction,
  mergeExerciseAction,
  updateExerciseAction,
} from "../../actions";

type Props = { params: Promise<{ id: string }> };

export default async function ExercisePage({ params }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const db = getDb();
  const [exercises, sessions] = await Promise.all([
    listExercises(db, owner),
    listSessions(db, owner, "2000-01-01", "2999-12-31"),
  ]);
  const exercise = exercises.find((e) => e.id === id);
  if (!exercise) notFound();
  const history = exerciseHistory(sessions, id);
  const locale = settings.locale;
  const x = t.exercises;
  return (
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={exercise.name}
        back={{ href: "/training/exercises", label: x.back }}
      />
      {history.length > 0 && (
        <Section title={x.progress} icon={<TrendingUp size={20} aria-hidden="true" />}>
          <ProgressChart points={history} label={x.progressLabel} locale={locale} />
          <h3 className="font-display text-item font-bold">{x.history}</h3>
          <ul className="flex flex-col text-meta">
            {[...history].reverse().map((p) => (
              <li key={p.sessionId} className="item flex justify-between gap-3 py-1">
                <Link
                  href={`/training/${p.sessionId}`}
                  className="underline-offset-4 hover:underline"
                >
                  {`${p.day.slice(8, 10)}/${p.day.slice(5, 7)}/${p.day.slice(0, 4)}`}
                </Link>
                <span className="font-display text-muted tabular-nums">
                  {setsText(p.sets, locale)}
                  {p.bestE1rm !== null &&
                    ` · 1RM ~${formatNumber(String(p.bestE1rm), locale, 1)}`}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title={t.training.editTitle}>
        <ExerciseForm
          action={updateExerciseAction.bind(null, id)}
          initial={{
            name: exercise.name,
            kind: exercise.kind,
            muscleGroups: exercise.muscleGroups.filter(isMuscleGroup).join(","),
            pattern: exercise.pattern ?? "",
            equipment: exercise.equipment ?? "",
            unilateral: exercise.unilateral ? "on" : "",
            notes: exercise.notes,
          }}
          submitLabel={x.save}
          t={{ exercises: t.exercises, training: t.training, errors: t.errors }}
        />
      </Section>
      <Section title={x.mergeTitle}>
        <MergeForm
          action={mergeExerciseAction.bind(null, id)}
          others={exercises
            .filter((e) => e.id !== id)
            .map(({ id: oid, name }) => ({ id: oid, name }))}
          t={{ exercises: t.exercises, errors: t.errors }}
        />
      </Section>
      <ActionButtonForm
        action={deleteExerciseAction.bind(null, id)}
        label={x.delete}
        icon={<Trash2 size={16} aria-hidden="true" />}
      />
    </div>
  );
}
