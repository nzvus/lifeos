/**
 * features/nutrition/trends/Trends.tsx — the chosen period: first the
 * numbers (Analysis), then energy (TrendChart, with its average over the
 * logged days), whatever the page puts next to it (`beside`: the training
 * chart), the macros side by side per day and the limits (GroupedChart).
 * The page (app/(app)/profiles) loads the history and the period.
 *
 * Targets per day are the day's own (fixed copy or default profile,
 * ADR-0008) plus the automatic maxima for sugars, saturated fat and salt
 * (core/nutrition/targets.ts withAutoTargets) unless turned off, exactly as
 * on the day page.
 */
import { average } from "@/core/nutrition/insights";
import { NUTRIENT_UNIT, type NutrientKey } from "@/core/nutrition/nutrients";
import { groupedBars } from "@/core/nutrition/trends";
import type { DaySummary } from "@/core/nutrition/repositories/history";
import { emptyTargets } from "@/core/nutrition/repositories/profiles";
import { withAutoTargets } from "@/core/nutrition/targets";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { Analysis } from "./Analysis";
import { ChartLegend } from "./ChartLegend";
import { GroupedChart } from "./GroupedChart";
import { TrendChart } from "./TrendChart";

type Props = {
  history: DaySummary[];
  today: string;
  timeZone: string;
  /** Recommended maxima where no target is set (preferences). */
  autoTargets: boolean;
  locale: Locale;
  /** Shown right after the energy chart (the training chart). */
  beside?: React.ReactNode;
  t: Pick<Messages, "trends" | "nutrients" | "analysis">;
};

const MACROS: NutrientKey[] = ["protein", "carbs", "fat", "fiber"];
const LIMITS: NutrientKey[] = ["sugars", "saturatedFat", "salt"];

export function Trends({
  history,
  today,
  timeZone,
  autoTargets,
  locale,
  beside,
  t,
}: Props) {
  const targetsByDay = history.map((d) => {
    const own = d.targets ?? emptyTargets();
    return autoTargets ? withAutoTargets(own).targets : own;
  });
  const kcalMean = average(
    history.filter((d) => d.logged).map((d) => d.totals.nutrients.kcal),
  );
  return (
    <div className="flex flex-col gap-8">
      <Analysis
        history={history}
        targets={targetsByDay}
        today={today}
        timeZone={timeZone}
        locale={locale}
        t={t}
      />
      <div className="grid gap-x-8 gap-y-8 @3xl:grid-cols-2">
        <div className="flex flex-col gap-2">
          <TrendChart
            nutrient="kcal"
            title={t.nutrients.kcal}
            unit={NUTRIENT_UNIT.kcal}
            summary={
              kcalMean === null
                ? t.trends.noData
                : fill(t.trends.average, {
                    v: formatNumber(kcalMean, locale, 0),
                    unit: NUTRIENT_UNIT.kcal,
                  })
            }
            days={history.map((d, i) => ({
              day: d.day,
              value: d.logged ? d.totals.nutrients.kcal : null,
              target: targetsByDay[i]!.kcal,
            }))}
            locale={locale}
            label={t.trends.chartLabel}
          />
          <ChartLegend t={t.trends} />
        </div>
        {beside}
        {(
          [
            [t.trends.macrosTitle, MACROS],
            [t.trends.limitsTitle, LIMITS],
          ] as const
        ).map(([title, keys]) => (
          <GroupedChart
            key={title}
            title={title}
            days={history.map((d) => d.day)}
            bars={groupedBars(
              history.map((d, i) => ({
                logged: d.logged,
                values: d.totals.nutrients,
                targets: targetsByDay[i]!,
              })),
              keys,
            )}
            names={t.nutrients}
            units={NUTRIENT_UNIT}
            averageOf={(v) => fill(t.trends.averageOf, { v })}
            relativeNote={t.trends.relativeNote}
            locale={locale}
            label={t.trends.chartLabel}
          />
        ))}
      </div>
    </div>
  );
}
