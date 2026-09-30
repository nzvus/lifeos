/**
 * features/nutrition/trends/Trends.tsx — the chosen period: first the
 * numbers (Analysis), then every nutrient as a TrendChart with its average
 * over the days something was logged. The page (app/(app)/profiles) loads the history and the period.
 *
 * Targets per day are the day's own (fixed copy or default profile,
 * ADR-0008) plus the automatic maxima for sugars, saturated fat and salt
 * (core/nutrition/targets.ts withAutoTargets) unless turned off, exactly as
 * on the day page.
 */
import { average } from "@/core/nutrition/insights";
import { NUTRIENT_KEYS, NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { DaySummary } from "@/core/nutrition/repositories/history";
import { emptyTargets } from "@/core/nutrition/repositories/profiles";
import { withAutoTargets } from "@/core/nutrition/targets";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { Analysis } from "./Analysis";
import { ChartLegend } from "./ChartLegend";
import { TrendChart } from "./TrendChart";

type Props = {
  history: DaySummary[];
  today: string;
  timeZone: string;
  /** Recommended maxima where no target is set (preferences). */
  autoTargets: boolean;
  locale: Locale;
  t: Pick<Messages, "trends" | "nutrients" | "analysis">;
};

export function Trends({ history, today, timeZone, autoTargets, locale, t }: Props) {
  const targetsByDay = history.map((d) => {
    const own = d.targets ?? emptyTargets();
    return autoTargets ? withAutoTargets(own).targets : own;
  });
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
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        {NUTRIENT_KEYS.map((k) => {
          const logged = history
            .filter((d) => d.logged)
            .map((d) => d.totals.nutrients[k]);
          const mean = average(logged);
          return (
            <TrendChart
              key={k}
              nutrient={k}
              title={t.nutrients[k]}
              unit={NUTRIENT_UNIT[k]}
              summary={
                mean === null
                  ? t.trends.noData
                  : fill(t.trends.average, {
                      v: formatNumber(mean, locale, k === "kcal" ? 0 : 1),
                      unit: NUTRIENT_UNIT[k],
                    })
              }
              days={history.map((d, i) => ({
                day: d.day,
                value: d.logged ? d.totals.nutrients[k] : null,
                target: targetsByDay[i]![k],
              }))}
              locale={locale}
              label={t.trends.chartLabel}
            />
          );
        })}
      </div>
      <ChartLegend t={t.trends} />
    </div>
  );
}
