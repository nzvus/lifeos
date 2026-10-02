/**
 * app/(app)/training/exercises/[id]/page.tsx — URL /training/exercises/<id>:
 * its guide and today's target (ADR-0028), the exercise's progression
 * (estimated 1RM per session), its history,
 * editing, merging into another exercise, and the "⋯" menu (to the trash
 * when unused, ADR-0015). `?from=` is where back, Cancel and saving lead.
 */
import { BookOpen, Merge, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { isMuscleGroup } from "@/core/training/anatomy";
import { getDb } from "@/app/_server/runtime";
import { idInput } from "@/core/nutrition/validation";
import { exerciseHistory } from "@/core/training/analysis";
import { setsText } from "@/core/training/display";
import { GUIDES, guideKeyOf } from "@/core/training/guides";
import { bestSet, nextTarget } from "@/core/training/targets";
import { ExerciseGuide } from "@/features/training/live/ExerciseGuide";
import { formatNumber } from "@/core/shared/format";
import { listExercises } from "@/core/training/repositories/exercises";
import { listSessions } from "@/core/training/repositories/sessions";
import { ExerciseForm } from "@/features/training/exercises/ExerciseForm";
import { MergeForm } from "@/features/training/exercises/MergeForm";
import { ProgressChart } from "@/features/training/exercises/ProgressChart";
import { safeFrom } from "@/core/shared/navigation";
import { PageHeader } from "@/ui/PageHeader";
import { TrashMenu } from "@/ui/TrashMenu";
import { Section } from "@/ui/Section";
import {
  deleteExerciseAction,
  mergeExerciseAction,
  restoreExerciseAction,
  updateExerciseAction,
} from "../../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function ExercisePage({ params, searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const from = safeFrom((await searchParams).from, "/training/exercises");
  const db = getDb();
  const [exercises, sessions] = await Promise.all([
    listExercises(db, owner),
    listSessions(db, owner, "2000-01-01", "2999-12-31"),
  ]);
  const exercise = exercises.find((e) => e.id === id);
  if (!exercise) notFound();
  const history = exerciseHistory(sessions, id);
  // ADR-0028: the guide of its pattern, and today's target from last time.
  const guideKey = guideKeyOf(exercise);
  const doneSets = sessions
    .filter((s) => s.status === "done")
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .flatMap((s) => s.exercises.filter((e) => e.exerciseId === id).map((e) => e.sets));
  const target = guideKey ? nextTarget(GUIDES[guideKey], doneSets[0]) : null;
  const best = bestSet(doneSets.flat());
  const locale = settings.locale;
  const x = t.exercises;
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={exercise.name}
        back={{
          href: from,
          label: from === "/training/exercises" ? x.back : t.actions.back,
        }}
        menu={
          <TrashMenu
            id={id}
            from={from}
            name={exercise.name}
            trash={deleteExerciseAction}
            restore={restoreExerciseAction}
            labels={t.actions}
          />
        }
      />
      {(guideKey || best) && (
        <Section
          title={t.guides.section}
          icon={<BookOpen size={20} aria-hidden="true" />}
        >
          <ExerciseGuide
            guideKey={guideKey}
            target={target}
            best={best}
            locale={locale}
            t={t.guides}
          />
        </Section>
      )}
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
      {/* The form brings its own card ("General"). */}
      <ExerciseForm
        id={id}
        from={from}
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
        t={{
          exercises: t.exercises,
          training: t.training,
          errors: t.errors,
          actions: t.actions,
        }}
      />
      <Section title={x.mergeTitle} icon={<Merge size={20} aria-hidden="true" />}>
        <MergeForm
          action={mergeExerciseAction.bind(null, id)}
          others={exercises
            .filter((e) => e.id !== id)
            .map(({ id: oid, name }) => ({ id: oid, name }))}
          t={{ exercises: t.exercises, errors: t.errors }}
        />
      </Section>
    </div>
  );
}
