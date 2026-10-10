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
import type { DayExplained } from "@/core/day/explain";
import { ExplainDay } from "@/features/nutrition/log/ExplainDay";
import { goalOf, type Range } from "@/core/energy/energy";
import { goalKind } from "@/core/energy/goal";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { GoalLine } from "@/features/nutrition/log/GoalLine";
import { fill, type Messages } from "@/i18n";
import { setGoalDeficitAction, undoCheckinAction } from "./actions";
import { UndoCheckin } from "@/features/nutrition/log/UndoCheckin";

const mid = (r: Range) => (r.low + r.high) / 2;

export function DayGoal({
  day,
  today,
  dayTargets,
  dynamic,
  params,
  basis,
  weightGoal,
  explained,
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
  /** How the day's numbers were built (core/day/explain.ts), or null. */
  explained: DayExplained | null;
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
          <>
            <GoalLine
              day={day}
              profileId={basis === "type" ? dayTargets.profileId : null}
              title={
                // ADR-0046: with a goal, the goal's name; the rate when it moves.
                weightGoal && basis !== "type"
                  ? [
                      t.energy.weightGoal.kindsShort[goalKind(weightGoal)],
                      basis === "checkin"
                        ? t.energy.weightGoal.lineCheckin
                        : Number(weightGoal.ratePctWeek) !== 0 &&
                          fill(t.energy.weightGoal.lineGoal, {
                            rate: `${Number(weightGoal.ratePctWeek) > 0 ? "+" : "−"}${formatNumber(String(Math.abs(Number(weightGoal.ratePctWeek))), locale, 2)}`,
                          }),
                    ]
                      .filter(Boolean)
                      .join(" · ")
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
                // Nothing logged or planned: no balance yet (2026-10-10 audit).
                withPlan:
                  Number(withPlannedKcal) === 0
                    ? null
                    : Math.round(Number(withPlannedKcal) - mid(total.withPlan)),
                soFar:
                  day <= today && Number(withPlannedKcal) !== 0
                    ? Math.round(Number(eatenKcal) - mid(total.done))
                    : null,
              }}
              action={setGoalDeficitAction}
              locale={locale}
              t={{ energy: t.energy, actions: t.actions, errors: t.errors }}
            />
            {explained && (
              <ExplainDay x={explained} locale={locale} t={t.energy.weightGoal} />
            )}
            {/* ADR-0048: a fixed week can be undone, from today on. */}
            {basis === "checkin" && day >= today && (
              <UndoCheckin undo={undoCheckinAction} t={t.energy.weightGoal} />
            )}
          </>
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
