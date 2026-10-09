/**
 * app/(app)/profiles/page.tsx — URL /profiles, the "Progress" tab (design
 * review S5, 2026-10-02), one view at a time (?view=):
 *   trends (default)  how the days went over a period (every nutrient,
 *                     7 / 30 / 90 days, scrollable back in time) and sleep
 *                     (training's own chart is in Training, ADR-0033);
 *   weight            weigh-ins read with their context, the trend, BMI
 *                     (ADR-0027) — moved here from Training;
 *   training          the week, 4 weeks per day, exercise and routine trends,
 *                     the history (ADR-0035; ./training-view.tsx).
 * The coming days are in the Plan tab (ADR-0035); ?view=coming redirects.
 * The day types that define the targets (ADR-0008) moved to Settings.
 *
 * The period is in the URL (?range=30&to=2026-09-30); without it (or when
 * invalid), the user's default period (preferences) up to today.
 */
import { readDays } from "@/core/day/repositories/days";
import { Dumbbell, Scale, TrendingUp } from "lucide-react";
import { TrainingProgress } from "./training-view";
import { redirect } from "next/navigation";
import { getWeighIns } from "@/core/energy/repositories/energy";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getHistory } from "@/core/nutrition/repositories/history";
import { TREND_RANGES, type TrendRange } from "@/core/nutrition/preferences";
import { daysEnding, isValidDay, todayIn, addDays } from "@/core/shared/dates";
import { listMeasurements } from "@/core/training/repositories/measurements";
import { RangeNav } from "@/features/nutrition/trends/RangeNav";
import { Trends } from "@/features/nutrition/trends/Trends";
import { WeightSection } from "@/features/training/body/WeightSection";
import { SleepChart } from "@/features/training/body/SleepChart";
import { listSleep } from "@/core/training/repositories/sleep";
import { PageHeader } from "@/ui/PageHeader";
import { Section } from "@/ui/Section";
import { SubNav } from "@/ui/SubNav";
import { FoodNav } from "@/features/nutrition/nav/FoodNav";
import { CaffeineChart } from "@/features/supplements/CaffeineChart";
import { dosesBetween } from "@/core/supplements/repositories/doses";
import { supplementsPeriod } from "@/core/supplements/period";
import { TrainingNav } from "@/features/training/nav/TrainingNav";
import { deleteMeasurementAction, restoreMeasurementAction } from "../training/actions";

const VIEWS = ["trends", "weight", "training"] as const;
type View = (typeof VIEWS)[number];

type Props = {
  searchParams: Promise<{ view?: string; range?: string; to?: string; week?: string }>;
};

export default async function ProgressPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const params = await searchParams;
  // ADR-0035: the coming days moved to the Plan tab; old links still work.
  if (params.view === "coming") redirect("/training/plan");
  const view: View = VIEWS.find((v) => v === params.view) ?? "trends";
  const today = todayIn(settings.timezone);
  const db = getDb();
  const g = t.progress;

  let body;
  if (view === "training") {
    // ADR-0035: how training is going (was Training → Sessions).
    body = (
      <TrainingProgress
        owner={owner}
        settings={settings}
        today={today}
        week={params.week}
        t={t}
      />
    );
  } else if (view === "weight") {
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
  } else {
    // No period in the URL: the user's default (preferences).
    const range: TrendRange =
      TREND_RANGES.find((r) => String(r) === params.range) ??
      settings.preferences.trendsRange;
    const to =
      params.to && isValidDay(params.to) && params.to <= today ? params.to : today;
    const days = daysEnding(to, range);
    const [stored, resolved, nights, doses] = await Promise.all([
      getHistory(db, owner, days[0]!, to),
      // ADR-0040: each day's targets from the one engine — a dynamic day's
      // stored copy holds parameters, not numbers.
      readDays(db, owner, days[0]!, to, { today, autoTargets: false }),
      listSleep(db, owner, days[0]!, to), // ADR-0031
      // ADR-0039: 90 days before the period too (creatine's stores remember).
      dosesBetween(db, owner, addDays(days[0]!, -90), to),
    ]);
    const history = stored.map((d) => {
      const r = resolved.get(d.day);
      return r && r.plan.source !== "none" ? { ...d, targets: r.own } : d;
    });
    const compounds = supplementsPeriod(doses, days);
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
            <>
              <SleepChart
                days={days}
                hours={new Map(nights.map((n) => [n.day, n.hours]))}
                locale={settings.locale}
                t={t}
              />
              {doses.length > 0 && (
                <CaffeineChart
                  days={days}
                  p={compounds}
                  locale={settings.locale}
                  t={t.supplements}
                />
              )}
            </>
          }
          t={t}
        />
      </Section>
    );
  }

  return (
    <>
      <PageHeader title={g.title} quiet />
      {/* ADR-0038: trends are Food's; weight and training are Body's. */}
      {view === "trends" ? (
        <FoodNav current="trends" t={t} />
      ) : (
        <>
          <TrainingNav current="progress" t={t} />
          <SubNav
            label={g.title}
            current={view}
            items={[
              {
                key: "training",
                href: "/profiles?view=training",
                label: g.training,
                icon: <Dumbbell size={16} aria-hidden="true" />,
              },
              {
                key: "weight",
                href: "/profiles?view=weight",
                label: g.weight,
                icon: <Scale size={16} aria-hidden="true" />,
              },
            ]}
          />
        </>
      )}
      {body}
    </>
  );
}
