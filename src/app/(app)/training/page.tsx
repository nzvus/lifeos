/**
 * app/(app)/training/page.tsx — URL /training[?week=YYYY-MM-DD], Training →
 * Sessions (ADR-0033): start a session (a routine at its latest version),
 * the week (numbers against the week before, sets per muscle group), the
 * last 28 days per day (tonnage and burn; moved here from Progress), and the
 * sessions of the last 90 days. Exercises, routines and programs have their
 * own tabs with their own stats.
 */
import { CalendarDays, Dumbbell, History, TrendingUp } from "lucide-react";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  addDays,
  daysEnding,
  isValidDay,
  startOfWeek,
  todayIn,
} from "@/core/shared/dates";
import { weekSummary } from "@/core/training/progress";
import { trainingByDay } from "@/core/training/analysis";
import { TrainingChart } from "@/features/training/progress/TrainingChart";
import { TrainingNav } from "@/features/training/nav/TrainingNav";
import { WeekProgress } from "@/features/training/progress/WeekProgress";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { listSessions } from "@/core/training/repositories/sessions";
import { PresetPicker } from "@/features/training/sessions/PresetPicker";
import { SessionList } from "@/features/training/sessions/SessionList";
import { deleteSessionAction, restoreSessionAction } from "./actions";
import { startOrPlanAction } from "./live-actions";
import { presetTiles } from "./preset-tiles";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";

type Props = { searchParams: Promise<{ week?: string }> };

export default async function TrainingPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const today = todayIn(settings.timezone);
  const thisMonday = startOfWeek(today);
  const asked = (await searchParams).week;
  const monday =
    asked && isValidDay(asked) && asked <= today ? startOfWeek(asked) : thisMonday;
  const db = getDb();
  const [history, presets, measurements] = await Promise.all([
    listSessions(db, owner, "2000-01-01", addDays(today, 30)),
    presetTiles(owner, today),
    listMeasurements(db, owner),
  ]);
  const sessions = history.filter((s) => s.day >= addDays(today, -90));
  const week = weekSummary(history, measurements, monday);
  const prev = weekSummary(history, measurements, addDays(monday, -7));
  const p = t.training.progress;
  return (
    <>
      <PageHeader title={t.training.title} />
      <TrainingNav current="sessions" t={t} />
      <Section
        title={t.training.startFrom}
        icon={<Dumbbell size={20} aria-hidden="true" />}
      >
        <p className="text-meta text-muted">{t.training.live.startHint}</p>
        <PresetPicker presets={presets} start={startOrPlanAction} t={t.training} />
      </Section>
      <Section
        title={monday === thisMonday ? p.thisWeek : p.week}
        icon={<CalendarDays size={20} aria-hidden="true" />}
      >
        <WeekProgress
          week={week}
          prev={prev}
          prevHref={`/training?week=${addDays(monday, -7)}`}
          nextHref={
            monday === thisMonday
              ? null
              : addDays(monday, 7) === thisMonday
                ? "/training"
                : `/training?week=${addDays(monday, 7)}`
          }
          locale={settings.locale}
          t={{ progress: p, groups: t.exercises.groups }}
        />
        {history.some(
          (x) =>
            x.exercises.length === 0 &&
            x.status === "done" &&
            x.day >= week.from &&
            x.day <= week.to,
        ) && <p className="text-meta text-muted">{t.training.estimate.noSets}</p>}
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
      <Section title={t.training.recent} icon={<History size={20} aria-hidden="true" />}>
        {sessions.length === 0 ? (
          <p className="text-muted">{t.training.empty}</p>
        ) : (
          <SessionList
            sessions={[...sessions].reverse()}
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
