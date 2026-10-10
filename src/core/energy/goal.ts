/**
 * core/energy/goal.ts — targets from a goal (ADR-0043). Pure.
 *
 *   deficit   the rate as % of body weight a week, turned into kcal a day:
 *             −0.5 % at 76 kg = 0.38 kg a week × 7,700 ÷ 7 = 418 kcal
 *   kcal      what you spend − the deficit, never under the floor
 *             (standard = the BMR, low = 1,200 kcal)
 *   protein   1.6 / 1.8 / 2.0 / 2.2 g per kg of the target weight (of the
 *             current one without a target)
 *   fat       25 / 20 / 35 % of kcal by the split, never under 0.6 g/kg
 *   carbs     the rest (ADR-0040); fibre 14 g per 1,000 kcal
 *
 * A live day with a goal uses goalTargets over that day's expenditure;
 * the weekly check-in uses it over the last 7 days' average and freezes
 * the result for the week, the same each day.
 */
import type { DietSplit, GoalKind, KcalFloor, ProteinPreference } from "../db/schema";

/** kcal in a kilo of body weight change (as in calibration.ts). */
const KCAL_PER_KG = 7700;
export const PROTEIN_G_PER_KG: Record<ProteinPreference, number> = {
  low: 1.6,
  moderate: 1.8,
  high: 2.0,
  extra: 2.2,
};
export const FAT_SHARE: Record<DietSplit, number> = {
  balanced: 0.25,
  low_fat: 0.2,
  low_carb: 0.35,
};
const FAT_MIN_G_PER_KG = 0.6;
const LOW_FLOOR_KCAL = 1200;

export type GoalParams = {
  ratePctWeek: string;
  targetKg: string | null;
  kcalFloor: KcalFloor;
  protein: ProteinPreference;
  split: DietSplit;
};

export type GoalTargets = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
};

/** kcal a day below what you spend (negative = a surplus). */
export function goalDeficit(ratePctWeek: string, weightKg: number): number {
  return Math.round((-Number(ratePctWeek) / 100) * weightKg * (KCAL_PER_KG / 7)) || 0; // never −0
}

export function floorKcal(floor: KcalFloor, bmr: number): number {
  return floor === "standard" ? Math.round(bmr) : LOW_FLOOR_KCAL;
}

/** Whether the goal loses weight (the bands keep protein higher then). */
export const isCutting = (g: Pick<GoalParams, "ratePctWeek">) =>
  Number(g.ratePctWeek) < 0;

export function goalTargets(
  expenditureKcal: number,
  goal: GoalParams,
  weightKg: number,
  bmr: number,
): GoalTargets & { floored: boolean } {
  const wanted = Math.round(expenditureKcal - goalDeficit(goal.ratePctWeek, weightKg));
  const floor = floorKcal(goal.kcalFloor, bmr);
  const kcal = Math.max(floor, wanted);
  const proteinKg = goal.targetKg === null ? weightKg : Number(goal.targetKg);
  const protein = Math.round(PROTEIN_G_PER_KG[goal.protein] * proteinKg);
  const fat = Math.max(
    Math.round(FAT_MIN_G_PER_KG * weightKg),
    Math.round((kcal * FAT_SHARE[goal.split]) / 9),
  );
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return {
    kcal,
    protein,
    fat,
    carbs,
    fiber: Math.round((kcal / 1000) * 14),
    floored: kcal > wanted,
  };
}

/**
 * The day the current check-in period started: the latest `weekday` on or
 * before `today` (0 = Sunday … 6 = Saturday).
 */
export function lastCheckinDay(today: string, weekday: number): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() - weekday + 7) % 7));
  return d.toISOString().slice(0, 10);
}

/**
 * ADR-0045: how fast each kind of goal should go, in % of body weight a
 * week (positive = gain). Below `min` the change hides in the scale's
 * noise; above `max` muscle is lost (cuts) or fat is gained (bulks).
 *   lose   0.5–1.0 % optimal (Helms 2014; Garthe 2011: 0.7 % kept more
 *          lean mass than 1.4 %); max 1.0
 *   gain   0.1–0.25 % optimal, between intermediates (~0.25–0.5 % a
 *          month) and beginners (1–1.5 % a month; Iraki 2019); max 0.5
 *   recomp without a target: 0 (maintenance, protein high). With one
 *          (ADR-0046, the developer: "recomposition should let me set a
 *          target, or how much fat to lose"): a slow loss, 0.25–0.5 %,
 *          or a slow gain, 0.05–0.15 % — slow enough to keep building
 *          muscle with high protein and training
 *   maintain: 0
 */
type Range = { min: number; low: number; high: number; max: number; usual: number };
export const RATE_RANGES: Record<"lose" | "gain" | "recompLose" | "recompGain", Range> = {
  lose: { min: 0.25, low: 0.5, high: 1.0, max: 1.0, usual: 0.7 },
  gain: { min: 0.05, low: 0.1, high: 0.25, max: 0.5, usual: 0.15 },
  recompLose: { min: 0.1, low: 0.25, high: 0.5, max: 0.5, usual: 0.35 },
  recompGain: { min: 0.05, low: 0.05, high: 0.15, max: 0.15, usual: 0.1 },
};

/** The protein each kind suggests (the form prefills it). */
export const KIND_PROTEIN: Record<GoalKind, ProteinPreference> = {
  lose: "extra",
  gain: "moderate",
  recomp: "extra",
  maintain: "moderate",
};

export type GoalPlan = {
  /** The rate to use now, % a week, signed (negative = lose). */
  ratePctWeek: number;
  /**
   * optimal: within the range; fast: the date needs more than the max, so
   * the max is used; slow: the date allows less than the optimal range
   * (fine, just slower than it could be); reached: the target is reached,
   * so maintenance; steady: recomposition or maintenance.
   */
  status: "optimal" | "fast" | "slow" | "reached" | "steady";
  /** kg to go (signed), when there is a target. */
  toGoKg: number | null;
  /** When the target is reached at this rate; null without a target. */
  expectedDay: string | null;
  /** The range for this kind, % a week, signed like the rate; null when steady. */
  range: { low: number; high: number } | null;
};

const DAY_MS = 86_400_000;
const dayNumber = (d: string) => Date.parse(`${d}T00:00:00Z`) / DAY_MS;
const dayOf = (n: number) => new Date(n * DAY_MS).toISOString().slice(0, 10);
/** Close enough to the target to call it reached, kg. */
const REACHED_KG = 0.3;

/**
 * The rate a goal asks for today, from its kind, the target weight and
 * day, and the current (trend) weight. Each check-in calls it again, so
 * the rate follows the weight toward the target.
 */
export function planGoal(
  goal: { kind: GoalKind; targetKg: string | null; targetDay: string | null },
  weightKg: number,
  today: string,
): GoalPlan {
  const wanted = goal.targetKg === null ? null : Number(goal.targetKg);
  // Recomposition with a target moves slowly toward it (ADR-0046).
  const recompWay =
    goal.kind === "recomp" && wanted !== null && Math.abs(wanted - weightKg) > REACHED_KG
      ? wanted < weightKg
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
  const target = goal.targetKg === null ? null : Number(goal.targetKg);
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
  const weeksFor = (pct: number) => Math.abs(toGo) / ((weightKg * pct) / 100);
  const expected = (pct: number) =>
    dayOf(dayNumber(today) + Math.ceil(weeksFor(pct) * 7));
  if (goal.targetDay === null || goal.targetDay <= today) {
    return {
      ratePctWeek: sign * r.usual,
      status: "optimal",
      toGoKg: toGo,
      expectedDay: expected(r.usual),
      range,
    };
  }
  const weeks = (dayNumber(goal.targetDay) - dayNumber(today)) / 7;
  const needed = (Math.abs(toGo) / weightKg / weeks) * 100;
  const pct = Math.min(r.max, Math.max(r.min, needed));
  const round = (x: number) => Math.round(x * 100) / 100;
  return {
    ratePctWeek: sign * round(pct),
    status: needed > r.max ? "fast" : needed < r.low ? "slow" : "optimal",
    toGoKg: toGo,
    expectedDay: expected(round(pct)),
    range,
  };
}

/**
 * The goal's parameters for a day at a weight: with a kind (ADR-0045) the
 * rate is planned from the target; a goal from before keeps its own rate.
 */
export function goalOnDay<
  G extends GoalParams & { kind: GoalKind | null; targetDay: string | null },
>(goal: G, weightKg: number, day: string): G {
  if (goal.kind === null) return goal;
  return {
    ...goal,
    ratePctWeek: planGoal(
      goal as G & { kind: GoalKind },
      weightKg,
      day,
    ).ratePctWeek.toFixed(2),
  };
}

/**
 * Checks a goal against the current weight and turns it into what is
 * stored (ADR-0045): the rate planned today. A target the wrong way
 * (losing toward a higher weight) or a day already past is an error.
 */
export function goalToStore<
  G extends { kind: GoalKind; targetKg: string | null; targetDay: string | null },
>(
  goal: G,
  weightKg: number | null,
  today: string,
):
  | { ok: true; value: G & { ratePctWeek: string } }
  | { ok: false; field: string; code: "target_direction" | "past_day" } {
  if (goal.targetDay !== null && goal.targetDay <= today)
    return { ok: false, field: "targetDay", code: "past_day" };
  const target = goal.targetKg === null ? null : Number(goal.targetKg);
  if (target !== null && weightKg !== null) {
    if (goal.kind === "lose" && target >= weightKg)
      return { ok: false, field: "targetKg", code: "target_direction" };
    if (goal.kind === "gain" && target <= weightKg)
      return { ok: false, field: "targetKg", code: "target_direction" };
  }
  const rate =
    weightKg === null
      ? goal.kind === "lose"
        ? -RATE_RANGES.lose.usual
        : goal.kind === "gain"
          ? RATE_RANGES.gain.usual
          : 0
      : planGoal(goal, weightKg, today).ratePctWeek;
  return { ok: true, value: { ...goal, ratePctWeek: rate.toFixed(2) } };
}

/**
 * The goal's plan for Settings (ADR-0045): the rate, what it means in kg
 * a week and kcal a day, and how it compares with the range. A goal from
 * before ADR-0045 is read by the sign of its stored rate.
 */
export function describeGoal(
  goal: {
    kind: GoalKind | null;
    ratePctWeek: string;
    targetKg: string | null;
    targetDay: string | null;
  },
  weightKg: number,
  today: string,
) {
  const stored = Number(goal.ratePctWeek);
  const kind: GoalKind =
    goal.kind ?? (stored < 0 ? "lose" : stored > 0 ? "gain" : "maintain");
  const plan =
    goal.kind === null
      ? {
          ratePctWeek: stored,
          status: stored === 0 ? ("steady" as const) : ("optimal" as const),
          expectedDay: null,
          range: null,
        }
      : planGoal({ ...goal, kind }, weightKg, today);
  return {
    kind,
    status: plan.status,
    ratePctWeek: plan.ratePctWeek,
    kgPerWeek: Math.round((plan.ratePctWeek / 100) * weightKg * 100) / 100,
    kcalPerDay: -goalDeficit(plan.ratePctWeek.toFixed(2), weightKg),
    targetKg: goal.targetKg === null ? null : Number(goal.targetKg),
    expectedDay: plan.expectedDay,
    range: plan.range,
  };
}

/** A goal's kind; a goal from before ADR-0045 is read by its rate's sign. */
export function goalKind(goal: { kind: GoalKind | null; ratePctWeek: string }): GoalKind {
  if (goal.kind) return goal.kind;
  const r = Number(goal.ratePctWeek);
  return r < 0 ? "lose" : r > 0 ? "gain" : "maintain";
}
