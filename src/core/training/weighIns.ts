/**
 * core/training/weighIns.ts — reading a weigh-in with its context
 * (ADR-0027). Pure; the repository gathers the facts.
 *
 * The scale swings 1–2 kg a day with water: food and drink still inside,
 * a workout's sweat, the toilet, and glycogen (about 3 g of water per gram)
 * after a day with more or fewer carbs or more salt than usual. A weigh-in
 * is never corrected; it is explained in words (clues) and given a
 * reliability that the trend and the calibration use as a weight.
 *
 *   standard   fasted, after the toilet, in the morning: reliability 1
 *   unknown    nothing said and nothing derived against it: 0.75
 *   each clue  multiplies it (below), never under 0.25
 *
 * The trend is an exponentially smoothed weight (Hacker's Diet: 10 % a
 * day), each weigh-in pulling by its reliability and the days since the
 * last. Body indices are screening, not diagnosis.
 */

import { SHORT_NIGHT_H } from "./sleep";

export type WeighInClue =
  | "after_food"
  | "after_training"
  | "before_toilet"
  | "late"
  | "carbs_up"
  | "carbs_down"
  | "salt_up"
  | "short_night";

/** What lowers a weigh-in's reliability, as a factor. */
const CLUE_FACTOR: Record<WeighInClue, number> = {
  after_food: 0.5,
  after_training: 0.6,
  late: 0.7,
  before_toilet: 0.85,
  carbs_up: 0.8,
  carbs_down: 0.8,
  salt_up: 0.85,
  short_night: 0.9,
};
const UNKNOWN = 0.75;
const FLOOR = 0.25;
/** kcal eaten before the scale that count as "after food" (a coffee doesn't). */
const ATE = 100;
/** From this local hour on, a weigh-in is "late" (a day's food and drink are in). */
const LATE_HOUR = 12;
/** Yesterday against the usual: ±30 % carbs, +30 % salt. */
const SWING = 0.3;

export type WeighInFacts = {
  /** What the user said (null = nothing). */
  said: {
    fasted: boolean | null;
    afterToilet: boolean | null;
    afterTraining: boolean | null;
  } | null;
  /** Local hour of the weigh-in (said, or when it was typed that day); null = unknown. */
  hour: number | null;
  /** kcal logged as eaten that day before the weigh-in (0 when unknown). */
  ateBeforeKcal: number;
  /** A done session started that day before the weigh-in. */
  trainedBefore: boolean;
  /** The day before, and the usual day (14-day average), when logged. */
  yesterday: { carbs: number; salt: number } | null;
  usual: { carbs: number; salt: number } | null;
  /** ADR-0031: hours slept the night before the weigh-in, if logged. */
  sleptHours?: number | null;
};

export type WeighInReading = { clues: WeighInClue[]; reliability: number };

export function readWeighIn(f: WeighInFacts): WeighInReading {
  const clues: WeighInClue[] = [];
  if (f.said?.fasted === false || f.ateBeforeKcal > ATE) clues.push("after_food");
  if (f.said?.afterTraining === true || f.trainedBefore) clues.push("after_training");
  if (f.said?.afterToilet === false) clues.push("before_toilet");
  if (f.hour !== null && f.hour >= LATE_HOUR) clues.push("late");
  if (f.yesterday && f.usual && f.usual.carbs > 0) {
    if (f.yesterday.carbs > f.usual.carbs * (1 + SWING)) clues.push("carbs_up");
    else if (f.yesterday.carbs < f.usual.carbs * (1 - SWING)) clues.push("carbs_down");
  }
  if (f.yesterday && f.usual && f.usual.salt > 0)
    if (f.yesterday.salt > f.usual.salt * (1 + SWING)) clues.push("salt_up");
  if (f.sleptHours != null && f.sleptHours < SHORT_NIGHT_H) clues.push("short_night");

  // Standard only when the user said so; otherwise "unknown" is the start.
  const standard =
    f.said?.fasted === true && f.said.afterToilet === true && f.hour !== null;
  const start = standard ? 1 : UNKNOWN;
  const reliability = clues.reduce((r, c) => r * CLUE_FACTOR[c], start);
  return { clues, reliability: Math.max(FLOOR, Math.round(reliability * 100) / 100) };
}

const DAILY = 0.1;
const dayIndex = (day: string) => Date.parse(`${day}T00:00:00Z`) / 86_400_000;

/**
 * The smoothed weight after each weigh-in (in order). Each pulls the trend
 * by 1 − 0.9^days since the previous one (a week apart pulls more than a
 * day apart), times its reliability; the first one starts it.
 */
export function weightTrend(
  points: readonly { day: string; kg: number; reliability: number }[],
): number[] {
  const out: number[] = [];
  let trend: number | null = null;
  let last = 0;
  for (const p of points) {
    const d = dayIndex(p.day);
    if (trend === null) trend = p.kg;
    else {
      const days = Math.max(1, d - last);
      trend += (1 - (1 - DAILY) ** days) * p.reliability * (p.kg - trend);
    }
    last = d;
    out.push(Math.round(trend * 100) / 100);
  }
  return out;
}

export type BmiCategory = "under" | "normal" | "over" | "obese";

/** Body indices from what is known; each is null without its inputs. */
export function bodyIndices(input: {
  kg: number;
  heightCm: number | null;
  waistCm: number | null;
  bodyFatPct: number | null;
}): {
  bmi: { value: number; category: BmiCategory } | null;
  /** Waist ÷ height; 0.5 is the usual line. */
  waistToHeight: number | null;
  /** Fat-free mass index, normalised to 1.80 m. */
  ffmi: number | null;
} {
  const m = input.heightCm ? input.heightCm / 100 : null;
  const r1 = (x: number) => Math.round(x * 10) / 10;
  const bmi = m ? input.kg / m ** 2 : null;
  return {
    bmi:
      bmi === null
        ? null
        : {
            value: r1(bmi),
            // WHO adult categories.
            category:
              bmi < 18.5 ? "under" : bmi < 25 ? "normal" : bmi < 30 ? "over" : "obese",
          },
    waistToHeight:
      m && input.waistCm
        ? Math.round((input.waistCm / input.heightCm!) * 100) / 100
        : null,
    ffmi:
      m && input.bodyFatPct !== null
        ? r1((input.kg * (1 - input.bodyFatPct / 100)) / m ** 2 + 6.1 * (1.8 - m))
        : null,
  };
}
