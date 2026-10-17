/**
 * E4 Body state — reading a weigh-in (engines.md E4; v1 ADR-0027, its rules
 * kept). The scale swings 1–2 kg a day with water: food and drink still
 * inside, a workout's sweat, the toilet, glycogen (about 3 g of water per
 * gram) after a day with more or fewer carbs or more salt than usual. A
 * weigh-in is never corrected; it is explained by clues and given a
 * reliability, which the filter uses as the weight of the observation.
 *   standard     fasted, after the toilet, at a known hour: 1
 *   unknown      nothing said and nothing derived against it: 0.75
 *   each clue    multiplies it, never under 0.25
 *   implausible  too far from the last plausible weigh-in to be water: 0.02
 */
import type { IsoDate } from "../time/date";
import { daysBetween } from "../time/date";

export type WeighInClue =
  | "after_food"
  | "after_training"
  | "before_toilet"
  | "late"
  | "carbs_up"
  | "carbs_down"
  | "salt_up"
  | "short_night"
  | "implausible";

const CLUE_FACTOR: Record<Exclude<WeighInClue, "implausible">, number> = {
  after_food: 0.5,
  after_training: 0.6,
  late: 0.7,
  before_toilet: 0.85,
  carbs_up: 0.8,
  carbs_down: 0.8,
  salt_up: 0.85,
  short_night: 0.9,
};
export const IMPLAUSIBLE = 0.02;
const UNKNOWN = 0.75;
const FLOOR = 0.25;
/** kcal eaten before the scale that count as "after food" (a coffee doesn't). */
const ATE = 100;
/** From this local hour on, the day's food and drink are in. */
const LATE_HOUR = 12;
/** Yesterday against the usual 14 days: ±30 % carbs, +30 % salt. */
const SWING = 0.3;
/** Hours under which a night is short (v1 sleep.ts). */
const SHORT_NIGHT_H = 6;

export type WeighInFacts = {
  /** What the person said; null when nothing. */
  said: {
    fasted: boolean | null;
    afterToilet: boolean | null;
    afterTraining: boolean | null;
  } | null;
  /** Local hour of the weigh-in; null when unknown. */
  hour: number | null;
  /** kcal eaten that day before the weigh-in. */
  ateBeforeKcal: number;
  /** A done session started that day before the weigh-in. */
  trainedBefore: boolean;
  /** The day before, and the usual day, when logged. */
  yesterday: { carbs: number; salt: number } | null;
  usual: { carbs: number; salt: number } | null;
  sleptHours?: number | null | undefined;
  implausible?: boolean | undefined;
};

export function readWeighIn(f: WeighInFacts): {
  clues: WeighInClue[];
  reliability: number;
} {
  const clues: Exclude<WeighInClue, "implausible">[] = [];
  if (f.said?.fasted === false || f.ateBeforeKcal > ATE) clues.push("after_food");
  if (f.said?.afterTraining === true || f.trainedBefore) clues.push("after_training");
  if (f.said?.afterToilet === false) clues.push("before_toilet");
  if (f.hour !== null && f.hour >= LATE_HOUR) clues.push("late");
  if (f.yesterday && f.usual && f.usual.carbs > 0) {
    if (f.yesterday.carbs > f.usual.carbs * (1 + SWING)) clues.push("carbs_up");
    else if (f.yesterday.carbs < f.usual.carbs * (1 - SWING)) clues.push("carbs_down");
  }
  if (
    f.yesterday &&
    f.usual &&
    f.usual.salt > 0 &&
    f.yesterday.salt > f.usual.salt * (1 + SWING)
  )
    clues.push("salt_up");
  if (f.sleptHours != null && f.sleptHours < SHORT_NIGHT_H) clues.push("short_night");
  if (f.implausible)
    return { clues: ["implausible", ...clues], reliability: IMPLAUSIBLE };
  const standard =
    f.said?.fasted === true && f.said.afterToilet === true && f.hour !== null;
  const r = clues.reduce((a, c) => a * CLUE_FACTOR[c], standard ? 1 : UNKNOWN);
  return { clues, reliability: Math.max(FLOOR, Math.round(r * 100) / 100) };
}

/** Water moves the scale 1–2 kg a day: 2.5 kg (or 3 %), plus 0.2 kg for each further day. */
export function plausibleGap(lastKg: number, days: number): number {
  return Math.max(2.5, lastKg * 0.03) + 0.2 * Math.max(0, days - 1);
}

/**
 * Which weigh-ins (oldest first) are too far from the last plausible one before them.
 * A flagged one never becomes the reference: the weigh-in after a typo is compared with the one before it.
 */
export function implausibleWeighIns(
  points: readonly { day: IsoDate; kg: number }[],
): boolean[] {
  let ref: { day: IsoDate; kg: number } | null = null;
  return points.map((p) => {
    if (ref) {
      const days = Math.max(1, daysBetween(ref.day, p.day));
      if (Math.abs(p.kg - ref.kg) > plausibleGap(ref.kg, days)) return true;
    }
    ref = p;
    return false;
  });
}
