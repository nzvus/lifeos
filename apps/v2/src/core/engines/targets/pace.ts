/**
 * E5 Targets — the pace of a weight goal (engines.md E5; v1 ADR-0045/0046,
 * its rules kept). The person says the goal, the target and the date; the
 * engine plans the rate within ranges, in % of body weight a week (positive =
 * gain). Below `min` the change hides in the scale's noise; above `max` muscle
 * is lost (cuts) or fat is gained (bulks).
 *   lose        0.5–1.0 % (Helms 2014; Garthe 2011: 0.7 % kept more lean mass than 1.4 %)
 *   gain        0.10–0.25 % (Iraki 2019); max 0.5
 *   recomp      with a target: a slow loss 0.25–0.5 %, or a slow gain 0.05–0.15 %;
 *               without one: maintenance with protein high
 *   maintain    0
 * Each check-in plans again from the trend weight, so the rate follows the
 * weight toward the target.
 */
import type { IsoDate } from "../time/date";
import { addDays, daysBetween } from "../time/date";

export type GoalKind = "lose" | "gain" | "recomp" | "maintain";
type Band = { min: number; low: number; high: number; max: number; usual: number };

export const RATE_RANGES: Record<"lose" | "gain" | "recompLose" | "recompGain", Band> = {
  lose: { min: 0.25, low: 0.5, high: 1.0, max: 1.0, usual: 0.7 },
  gain: { min: 0.05, low: 0.1, high: 0.25, max: 0.5, usual: 0.15 },
  recompLose: { min: 0.1, low: 0.25, high: 0.5, max: 0.5, usual: 0.35 },
  recompGain: { min: 0.05, low: 0.05, high: 0.15, max: 0.15, usual: 0.1 },
};
/** Close enough to the target to call it reached, kg. */
const REACHED_KG = 0.3;

export type Pace = {
  /** % of body weight a week, signed (negative = lose). */
  ratePctWeek: number;
  /**
   * optimal: within the range; fast: the date needs more than the max, so the max is used;
   * slow: the date allows less than the optimal range; reached: maintenance; steady: recomposition
   * without a target, or maintenance.
   */
  status: "optimal" | "fast" | "slow" | "reached" | "steady";
  toGoKg: number | null;
  expectedDay: IsoDate | null;
  range: { low: number; high: number } | null;
};

export function planPace(
  goal: { kind: GoalKind; targetKg: number | null; targetDay: IsoDate | null },
  weightKg: number,
  today: IsoDate,
): Pace {
  const target = goal.targetKg;
  const recompWay =
    goal.kind === "recomp" && target !== null && Math.abs(target - weightKg) > REACHED_KG
      ? target < weightKg
        ? "recompLose"
        : "recompGain"
      : null;
  if (goal.kind === "maintain" || (goal.kind === "recomp" && !recompWay))
    return {
      ratePctWeek: 0,
      status: "steady",
      toGoKg: null,
      expectedDay: null,
      range: null,
    };
  const key = recompWay ?? (goal.kind as "lose" | "gain");
  const r = RATE_RANGES[key];
  const sign = key === "lose" || key === "recompLose" ? -1 : 1;
  const range = { low: sign * r.low, high: sign * r.high };
  if (target === null)
    return {
      ratePctWeek: sign * r.usual,
      status: "optimal",
      toGoKg: null,
      expectedDay: null,
      range,
    };
  const toGo = target - weightKg;
  if (sign * toGo <= REACHED_KG)
    return { ratePctWeek: 0, status: "reached", toGoKg: toGo, expectedDay: today, range };
  const expected = (pct: number) =>
    addDays(today, Math.ceil((Math.abs(toGo) / ((weightKg * pct) / 100)) * 7));
  if (goal.targetDay === null || goal.targetDay <= today)
    return {
      ratePctWeek: sign * r.usual,
      status: "optimal",
      toGoKg: toGo,
      expectedDay: expected(r.usual),
      range,
    };
  const weeks = daysBetween(today, goal.targetDay) / 7;
  const needed = (Math.abs(toGo) / weightKg / weeks) * 100;
  const pct = Math.round(Math.min(r.max, Math.max(r.min, needed)) * 100) / 100;
  return {
    ratePctWeek: sign * pct,
    status: needed > r.max ? "fast" : needed < r.low ? "slow" : "optimal",
    toGoKg: toGo,
    expectedDay: expected(pct),
    range,
  };
}

/**
 * kcal a day below what is spent (negative = a surplus): pace × W × ρ / 7, with ρ the
 * density of a loss or of a gain from E4 (not a flat 7,700).
 */
export function deficitKcal(
  ratePctWeek: number,
  weightKg: number,
  density: { loss: number; gain: number },
): number {
  const rho = ratePctWeek < 0 ? density.loss : density.gain;
  return Math.round((-ratePctWeek / 100) * weightKg * (rho / 7)) || 0; // never −0
}
