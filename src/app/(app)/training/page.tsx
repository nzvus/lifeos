/**
 * app/(app)/training/page.tsx — URL /training[?week=YYYY-MM-DD]: training as
 * progress (S07). Start a session (a routine at its latest version), then the
 * week (numbers against the week before, sets per muscle group), routines
 * and exercises with their trends, the sessions of the last 90 days
 * (compact), body weight. Progress uses all done history.
 */
import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  Dumbbell,
  History,
  ListOrdered,
  Scale,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, isValidDay, startOfWeek, todayIn } from "@/core/shared/dates";
import { listExercises } from "@/core/training/repositories/exercises";
import { listRoutines } from "@/core/training/repositories/routines";
import { exerciseTrends, routineProgress, weekSummary } from "@/core/training/progress";
import { ExerciseTrendList } from "@/features/training/progress/ExerciseTrendList";
import { RoutineProgressList } from "@/features/training/progress/RoutineProgressList";
import { WeekProgress } from "@/features/training/progress/WeekProgress";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { listSessions } from "@/core/training/repositories/sessions";
import { MeasurementForm } from "@/features/training/body/MeasurementForm";
import { PresetPicker } from "@/features/training/sessions/PresetPicker";
import { SessionList } from "@/features/training/sessions/SessionList";
import { TrashMenu } from "@/ui/TrashMenu";
import { formatNumber } from "@/core/shared/format";
import {
  addMeasurementAction,
  deleteMeasurementAction,
  deleteSessionAction,
  restoreMeasurementAction,
  restoreSessionAction,
} from "./actions";
import { startOrPlanAction } from "./live-actions";
import { presetTiles } from "./preset-tiles";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { buttonClass, TEXT_LINK } from "@/ui/button";

type Props = { searchParams: Promise<{ week?: string }> };

/** How many recent exercises the page shows (the rest: the exercises page). */
const TRENDS = 8;

export default async function TrainingPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const today = todayIn(settings.timezone);
  const thisMonday = startOfWeek(today);
  const asked = (await searchParams).week;
  const monday =
    asked && isValidDay(asked) && asked <= today ? startOfWeek(asked) : thisMonday;
  const db = getDb();
  const [history, presets, measurements, routines, exercises] = await Promise.all([
    listSessions(db, owner, "2000-01-01", addDays(today, 30)),
    presetTiles(owner, today),
    listMeasurements(db, owner),
    listRoutines(db, owner),
    listExercises(db, owner),
  ]);
  const sessions = history.filter((s) => s.day >= addDays(today, -90));
  const week = weekSummary(history, measurements, monday);
  const prev = weekSummary(history, measurements, addDays(monday, -7));
  const trends = exerciseTrends(history.filter((s) => s.day <= today));
  const p = t.training.progress;
  return (
    <>
      <PageHeader
        title={t.training.title}
        action={{ href: "/training/new", label: t.training.new }}
      />
      <nav className="flex flex-wrap gap-2">
        <Link
          href="/training/exercises"
          className={buttonClass({ variant: "subtle", size: "sm" })}
        >
          <ListOrdered size={14} aria-hidden="true" />
          {t.exercises.title}
        </Link>
        <Link
          href="/training/routines"
          className={buttonClass({ variant: "subtle", size: "sm" })}
        >
          <ClipboardList size={14} aria-hidden="true" />
          {t.routines.title}
        </Link>
        <Link
          href="/training/programs"
          className={buttonClass({ variant: "subtle", size: "sm" })}
        >
          <CalendarRange size={14} aria-hidden="true" />
          {t.programs.open}
        </Link>
      </nav>
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
      {routines.length > 0 && (
        <Section title={p.routines} icon={<ClipboardList size={20} aria-hidden="true" />}>
          <RoutineProgressList
            routines={routineProgress(routines, history).sort((a, b) =>
              (b.last?.day ?? "").localeCompare(a.last?.day ?? ""),
            )}
            locale={settings.locale}
            t={p}
          />
        </Section>
      )}
      {trends.length > 0 && (
        <Section
          title={p.exercises}
          icon={<TrendingUp size={20} aria-hidden="true" />}
          aside={
            <Link href="/training/exercises" className={TEXT_LINK}>
              {p.all}
            </Link>
          }
        >
          <ExerciseTrendList
            trends={trends.slice(0, TRENDS)}
            exercises={new Map(exercises.map((e) => [e.id, e]))}
            locale={settings.locale}
            t={p}
          />
        </Section>
      )}
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
      <Section title={t.body.title} icon={<Scale size={20} aria-hidden="true" />}>
        <p className="text-meta text-muted">{t.body.hint}</p>
        <MeasurementForm
          action={addMeasurementAction}
          today={today}
          count={measurements.length}
          t={{ body: t.body, errors: t.errors }}
        />
        {measurements.length === 0 ? (
          <p className="text-meta text-muted">{t.body.none}</p>
        ) : (
          <ul className="flex flex-col text-meta">
            {[...measurements]
              .reverse()
              .slice(0, 10)
              .map((m) => (
                <li
                  key={m.id}
                  className="item flex items-center justify-between gap-3 py-1"
                >
                  <span className="tabular-nums">
                    {`${m.day.slice(8, 10)}/${m.day.slice(5, 7)}/${m.day.slice(0, 4)} · `}
                    <span className="font-display font-semibold">{`${formatNumber(m.weightKg ?? "0", settings.locale, 1)} kg`}</span>
                    {m.bodyFatPct &&
                      ` · ${formatNumber(m.bodyFatPct, settings.locale, 1)} %`}
                    {m.waistCm && ` · ${formatNumber(m.waistCm, settings.locale, 0)} cm`}
                  </span>
                  <TrashMenu
                    id={m.id}
                    name={`${m.day.slice(8, 10)}/${m.day.slice(5, 7)}/${m.day.slice(0, 4)}`}
                    trash={deleteMeasurementAction}
                    restore={restoreMeasurementAction}
                    labels={t.actions}
                  />
                </li>
              ))}
          </ul>
        )}
      </Section>
    </>
  );
}
