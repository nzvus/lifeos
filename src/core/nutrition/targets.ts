/**
 * core/nutrition/targets.ts — "how does today's total compare with my target?"
 *
 * Behaviour, so it lives in core (ADR-0002), not in the NutritionLabel
 * component that displays it. Exact arithmetic via Big; the result is plain
 * data the UI can render directly.
 */
import { Big, toFixedDisplay } from "../shared/decimal";

export type TargetComparison =
  | { status: "none" } // no target set for this nutrient
  | { status: "under"; remaining: string; percent: number }
  | { status: "over"; over: string; percent: number };

/**
 * `percent` is total/target in whole percent, capped at 100 so a progress bar
 * never overflows its track (the "over" status carries the real excess).
 */
export function compareToTarget(total: string, target: string | null): TargetComparison {
  if (target === null) return { status: "none" };
  const t = new Big(total);
  const goal = new Big(target);
  if (goal.eq(0)) return { status: "none" }; // a zero target can't be a ratio
  const percent = Math.min(
    100,
    t.div(goal).times(100).round(0, Big.roundDown).toNumber(),
  );
  return t.gt(goal)
    ? { status: "over", over: toFixedDisplay(t.minus(goal)), percent }
    : { status: "under", remaining: toFixedDisplay(goal.minus(t)), percent };
}
