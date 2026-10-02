/**
 * app/(app)/profiles/page.tsx — URL /profiles, the "Progress" tab (design
 * review S5, 2026-10-02), one view at a time (?view=):
 *   trends (default)  how the days went over a period (every nutrient,
 *                     7 / 30 / 90 days, scrollable back in time) and sleep
 *                     (training's own chart is in Training, ADR-0033);
 *   weight            weigh-ins read with their context, the trend, BMI
 *                     (ADR-0027) — moved here from Training;
 *   coming            the next 7 days: training, energy, targets.
 * The day types that define the targets (ADR-0008) moved to Settings.
 *
 * The period is in the URL (?range=30&to=2026-09-30); without it (or when
 * invalid), the user's default period (preferences) up to today.
 */
import Link from "next/link";
import { CalendarClock, Scale, TrendingUp } from "lucide-react";
import { getWeighIns } from "@/core/energy/repositories/energy";
import { weekOutlook } from "@/core/energy/repositories/outlook";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getHistory } from "@/core/nutrition/repositories/history";
import { TREND_RANGES, type TrendRange } from "@/core/nutrition/preferences";
import { daysEnding, isValidDay, todayIn } from "@/core/shared/dates";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { RangeNav } from "@/features/nutrition/trends/RangeNav";
import { Trends } from "@/features/nutrition/trends/Trends";
import { WeekOutlook } from "@/features/nutrition/trends/WeekOutlook";
import { WeightSection } from "@/features/training/body/WeightSection";
import { SleepChart } from "@/features/training/body/SleepChart";
import { listSleep } from "@/core/training/repositories/sleep";
import { TEXT_LINK } from "@/ui/button";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { SubNav } from "@/ui/SubNav";
import { deleteMeasurementAction, restoreMeasurementAction } from "../training/actions";

const VIEWS = ["trends", "weight", "coming"] as const;
type View = (typeof VIEWS)[number];

type Props = {
  searchParams: Promise<{ view?: string; range?: string; to?: string }>;
};

export default async function ProgressPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const params = await searchParams;
  const view: View = VIEWS.find((v) => v === params.view) ?? "trends";
  const today = todayIn(settings.timezone);
  const db = getDb();
  const g = t.progress;

  let body;
  if (view === "weight") {
    const [measurements, readings] = await Promise.all([
      listMeasurements(db, owner),
      getWeighIns(db, owner),
    ]);
    body = (
      <WeightSection
        measurements={measurements}
        readings={readings}
        locale={settings.locale}
        trash={deleteMeasurementAction}
        restore={restoreMeasurementAction}
        t={t}
      />
    );
  } else if (view === "coming") {
    const outlook = await weekOutlook(db, owner, today);
    body = (
      <Section
        title={t.outlook.title}
        subtitle={t.outlook.subtitle}
        aside={
          // ADR-0024/0029: the program lays the training out; change it there.
          <Link href="/training/programs" className={TEXT_LINK}>
            {t.outlook.editProgram}
          </Link>
        }
        icon={<CalendarClock size={20} aria-hidden="true" />}
      >
        <WeekOutlook
          days={outlook}
          locale={settings.locale}
          t={{ outlook: t.outlook, energy: t.energy, programs: t.programs }}
        />
      </Section>
    );
  } else {
    // No period in the URL: the user's default (preferences).
    const range: TrendRange =
      TREND_RANGES.find((r) => String(r) === params.range) ??
      settings.preferences.trendsRange;
    const to =
      params.to && isValidDay(params.to) && params.to <= today ? params.to : today;
    const days = daysEnding(to, range);
    const [history, nights] = await Promise.all([
      getHistory(db, owner, days[0]!, to),
      listSleep(db, owner, days[0]!, to), // ADR-0031
    ]);
    body = (
      <Section title={t.trends.title} icon={<TrendingUp size={20} aria-hidden="true" />}>
        <RangeNav
          range={range}
          from={days[0]!}
          to={to}
          today={today}
          locale={settings.locale}
          t={t.trends}
        />
        <Trends
          history={history}
          today={today}
          timeZone={settings.timezone}
          autoTargets={settings.preferences.autoTargets}
          locale={settings.locale}
          beside={
            // Training's chart lives in Training → Sessions (ADR-0033).
            <SleepChart
              days={days}
              hours={new Map(nights.map((n) => [n.day, n.hours]))}
              locale={settings.locale}
              t={t}
            />
          }
          t={t}
        />
      </Section>
    );
  }

  return (
    <>
      <PageHeader title={g.title} />
      <SubNav
        label={g.title}
        current={view}
        items={[
          {
            key: "trends",
            href: "/profiles",
            label: g.trends,
            icon: <TrendingUp size={16} aria-hidden="true" />,
          },
          {
            key: "weight",
            href: "/profiles?view=weight",
            label: g.weight,
            icon: <Scale size={16} aria-hidden="true" />,
          },
          {
            key: "coming",
            href: "/profiles?view=coming",
            label: g.coming,
            icon: <CalendarClock size={16} aria-hidden="true" />,
          },
        ]}
      />
      {body}
    </>
  );
}
