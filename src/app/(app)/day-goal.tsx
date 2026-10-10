/**
 * app/(app)/day-goal.tsx — under the day type on the day page (ADR-0014):
 * a dynamic day's goal in plain words (GoalLine: what kind of day, how far
 * from what you spend, what to eat), or why its targets can't be computed;
 * a fixed day's name and energy. Split out of page.tsx (800-line limit).
 * With a goal or a check-in (ADR-0043) the line shows their deficit and
 * has no pencil: the goal is changed in Settings.
 */
import type { DayTargets } from "@/core/nutrition/repositories/profiles";
import type { ResolvedDay } from "@/core/day/resolve";
import { goalOf, type Range } from "@/core/energy/energy";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { GoalLine } from "@/features/nutrition/log/GoalLine";
import { fill, type Messages } from "@/i18n";
import { setGoalDeficitAction } from "./actions";

const mid = (r: Range) => (r.low + r.high) / 2;

export function DayGoal({
  day,
  today,
  dayTargets,
  dynamic,
  params,
  basis,
  weightGoal,
  total,
  eatenKcal,
  withPlannedKcal,
  targetKcal,
  locale,
  t,
}: {
  day: string;
  today: string;
  dayTargets: DayTargets;
  /** The dynamic targets computed for the day, or null. */
  dynamic: { kcal: number } | null;
  /** What the day's numbers amount to (ResolvedDay.params), and their source. */
  params: ResolvedDay["params"];
  basis: ResolvedDay["basis"];
  weightGoal: ResolvedDay["weightGoal"];
  /** What the day costs, done and with the plan, or null without body data. */
  total: { done: Range; withPlan: Range } | null;
  eatenKcal: string;
  withPlannedKcal: string;
  targetKcal: string | null;
  locale: Locale;
  t: Messages;
}) {
  if (dayTargets.source === "none") return null;
  return (
    <div className="flex flex-col gap-0.5 rule-t-medium border-hairline pt-3">
      {dayTargets.dynamic ? (
        dynamic && total ? (
          <GoalLine
            day={day}
            profileId={basis === "type" ? dayTargets.profileId : null}
            title={
              basis === "checkin"
                ? t.energy.weightGoal.lineCheckin
                : basis === "goal" && weightGoal
                  ? fill(t.energy.weightGoal.lineGoal, {
                      rate: `${Number(weightGoal.ratePctWeek) > 0 ? "+" : ""}${formatNumber(weightGoal.ratePctWeek, locale, 2)}`,
                    })
                  : (() => {
                      const g = goalOf(dayTargets.dynamic);
                      return g ? t.energy.goals[g] : t.energy.goalCustom;
                    })()
            }
            deficitKcal={(params ?? dayTargets.dynamic).deficitKcal}
            eatKcal={dynamic.kcal}
            spentKcal={Math.round(mid(total.withPlan))}
            balance={{
              wanted: -(params ?? dayTargets.dynamic).deficitKcal,
              withPlan: Math.round(Number(withPlannedKcal) - mid(total.withPlan)),
              soFar:
                day <= today ? Math.round(Number(eatenKcal) - mid(total.done)) : null,
            }}
            action={setGoalDeficitAction}
            locale={locale}
            t={{ energy: t.energy, actions: t.actions, errors: t.errors }}
          />
        ) : (
          <span className="text-meta text-muted">{t.energy.dynamicMissing}</span>
        )
      ) : (
        <>
          <span className="font-display text-item font-semibold">{dayTargets.name}</span>
          {targetKcal !== null && (
            <span className="text-meta tabular-nums">
              {fill(t.energy.goalFixed, { kcal: formatNumber(targetKcal, locale, 0) })}
            </span>
          )}
        </>
      )}
    </div>
  );
}
