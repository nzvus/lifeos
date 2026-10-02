/**
 * app/(app)/profiles/training-view.tsx — Progress → Training (ADR-0035):
 * how training is going, in one place — the week against the one before
 * (sets per muscle group), the last 4 weeks day by day, each exercise's and
 * routine's trend, and the sessions of the last 90 days. Moved here from
 * Training → Sessions, Exercises and Routines, which are now libraries.
 */
import { CalendarDays, ClipboardList, Dumbbell, History, TrendingUp } from "lucide-react";
import { getDb } from "@/app/_server/runtime";
import type { Owner } from "@/core/identity/owner";
import type { Settings } from "@/core/nutrition/repositories/settings";
import { addDays, daysEnding, isValidDay, startOfWeek } from "@/core/shared/dates";
import { trainingByDay } from "@/core/training/analysis";
import { exerciseTrends, routineProgress, weekSummary } from "@/core/training/progress";
import { listExercises } from "@/core/training/repositories/exercises";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { listRoutines } from "@/core/training/repositories/routines";
import { listSessions } from "@/core/training/repositories/sessions";
import { ExerciseTrendList } from "@/features/training/progress/ExerciseTrendList";
import { RoutineProgressList } from "@/features/training/progress/RoutineProgressList";
import { TrainingChart } from "@/features/training/progress/TrainingChart";
import { WeekProgress } from "@/features/training/progress/WeekProgress";
import { SessionList } from "@/features/training/sessions/SessionList";
import type { Messages } from "@/i18n";
import { Section } from "@/ui/Section";
import { deleteSessionAction, restoreSessionAction } from "../training/actions";

const BASE = "/profiles?view=training";

export async function TrainingProgress({
  owner,
  settings,
  today,
  week: asked,
  t,
}: {
  owner: Owner;
  settings: Settings;
  today: string;
  /** ?week=YYYY-MM-DD: a past week to show. */
  week: string | undefined;
  t: Messages;
}) {
  const db = getDb();
  const thisMonday = startOfWeek(today);
  const monday =
    asked && isValidDay(asked) && asked <= today ? startOfWeek(asked) : thisMonday;
  const [history, measurements, exercises, routines] = await Promise.all([
    listSessions(db, owner, "2000-01-01", today),
    listMeasurements(db, owner),
    listExercises(db, owner),
    listRoutines(db, owner),
  ]);
  const done = history.filter((s) => s.status === "done");
  const p = t.training.progress;
  const week = weekSummary(history, measurements, monday);
  const prev = weekSummary(history, measurements, addDays(monday, -7));
  const trends = exerciseTrends(done);
  const progress = routineProgress(routines, history).sort((a, b) =>
    (b.last?.day ?? "").localeCompare(a.last?.day ?? ""),
  );
  const recent = history.filter((s) => s.day >= addDays(today, -90));
  return (
    <>
      <Section
        title={monday === thisMonday ? p.thisWeek : p.week}
        icon={<CalendarDays size={20} aria-hidden="true" />}
      >
        <WeekProgress
          week={week}
          prev={prev}
          prevHref={`${BASE}&week=${addDays(monday, -7)}`}
          nextHref={
            monday === thisMonday
              ? null
              : addDays(monday, 7) === thisMonday
                ? BASE
                : `${BASE}&week=${addDays(monday, 7)}`
          }
          locale={settings.locale}
          t={{ progress: p, groups: t.exercises.groups }}
        />
      </Section>
      <Section
        title={t.training.chart.period}
        icon={<TrendingUp size={20} aria-hidden="true" />}
      >
        <TrainingChart
          days={trainingByDay(daysEnding(today, 28), history, measurements)}
          locale={settings.locale}
          t={t.training}
        />
      </Section>
      {trends.length > 0 && (
        <Section title={p.exercises} icon={<Dumbbell size={20} aria-hidden="true" />}>
          <ExerciseTrendList
            trends={trends}
            exercises={new Map(exercises.map((e) => [e.id, e]))}
            locale={settings.locale}
            t={p}
          />
        </Section>
      )}
      {progress.some((x) => x.last) && (
        <Section title={p.routines} icon={<ClipboardList size={20} aria-hidden="true" />}>
          <RoutineProgressList routines={progress} locale={settings.locale} t={p} />
        </Section>
      )}
      <Section title={t.training.recent} icon={<History size={20} aria-hidden="true" />}>
        {recent.length === 0 ? (
          <p className="text-muted">{t.training.empty}</p>
        ) : (
          <SessionList
            sessions={[...recent].reverse()}
            measurements={measurements}
            showDay
            locale={settings.locale}
            t={t.training}
            tx={t.exercises}
            trash={deleteSessionAction}
            restore={restoreSessionAction}
            labels={t.actions}
          />
        )}
      </Section>
    </>
  );
}
