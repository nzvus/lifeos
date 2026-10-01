/**
 * core/nutrition/bands.ts — for each macro a FLOOR, a GOOD zone and a
 * CEILING (ADR-0023), from body weight, the day's training and the goal.
 * More is not better past a point: protein above ≈2.2 g/kg adds nothing for
 * muscle; carbohydrate needs follow training; fat has a floor for hormones.
 * Sources: ISSN position stands (protein 2017, nutrient timing 2017),
 * ACSM/AND/DC 2016 (carbohydrate by training load).
 *
 *   protein  floor 1.2 · good 1.6–2.2 (cut 1.8–2.4) · ceiling 2.6 (cut 2.8) g/kg
 *   fat      floor 0.6 · good 0.8–1.0 g/kg · ceiling 35 % of kcal
 *   carbs    rest 2–3 · training 3–5 · long training 5–7 g/kg; floor 1.5
 *            (2.5 when training) · ceiling 8 g/kg
 *   fibre    floor 10 · good 14–20 per 1000 kcal · ceiling 70 g
 *   energy   the day's target: good ±5 %, floor −15 %, ceiling +10 %
 *
 * Pure; tested in bands.test.ts.
 */
import type { NutrientKey } from "./nutrients";

export type Band = { floor: number; low: number; high: number; ceiling: number };
export type Bands = Partial<Record<NutrientKey, Band>>;

/** rest: no training; training: a session; long: ≥ 90 min, or 60+ min of cardio. */
export type TrainingLoad = "rest" | "training" | "long";

export function trainingLoad(minutes: number, cardioMinutes: number): TrainingLoad {
  if (minutes >= 90 || cardioMinutes >= 60) return "long";
  return minutes > 0 ? "training" : "rest";
}

const CARBS: Record<TrainingLoad, [number, number]> = {
  rest: [2, 3],
  training: [3, 5],
  long: [5, 7],
};

const r = (x: number) => Math.round(x);

/** The top of the carbs' good zone, g: where a dynamic target stops (ADR-0023). */
export function carbsGoodMax(kg: number, load: TrainingLoad): number {
  return r(CARBS[load][1] * kg);
}

export function macroBands(input: {
  kg: number;
  /** The day's energy target, kcal (null: no energy band, fat ceiling at 2000). */
  kcal: number | null;
  load: TrainingLoad;
  /** A deficit keeps protein higher. */
  cutting: boolean;
}): Bands {
  const { kg, load, cutting } = input;
  const kcal = input.kcal ?? 2000;
  const [cLo, cHi] = CARBS[load];
  const bands: Bands = {
    protein: {
      floor: r(1.2 * kg),
      low: r((cutting ? 1.8 : 1.6) * kg),
      high: r((cutting ? 2.4 : 2.2) * kg),
      ceiling: r((cutting ? 2.8 : 2.6) * kg),
    },
    fat: {
      floor: r(0.6 * kg),
      low: r(0.8 * kg),
      high: r(Math.min(1.0 * kg, (kcal * 0.35) / 9)),
      ceiling: r(Math.max(1.0 * kg, (kcal * 0.35) / 9)),
    },
    carbs: {
      floor: r((load === "rest" ? 1.5 : 2.5) * kg),
      low: r(cLo * kg),
      high: r(cHi * kg),
      ceiling: r(8 * kg),
    },
    fiber: {
      floor: r((10 * kcal) / 1000),
      low: r((14 * kcal) / 1000),
      high: r((20 * kcal) / 1000),
      ceiling: 70,
    },
  };
  if (input.kcal !== null)
    bands.kcal = {
      floor: r(kcal * 0.85),
      low: r(kcal * 0.95),
      high: r(kcal * 1.05),
      ceiling: r(kcal * 1.1),
    };
  return bands;
}

export type Zone = "below_floor" | "low" | "good" | "high" | "above_ceiling";

export function zoneOf(value: number, b: Band): Zone {
  if (value < b.floor) return "below_floor";
  if (value < b.low) return "low";
  if (value <= b.high) return "good";
  if (value <= b.ceiling) return "high";
  return "above_ceiling";
}

/**
 * 0–100 for a value against its band: 100 in the good zone, falling to 50
 * at the floor or the ceiling, to 0 as far again beyond them.
 */
export function zoneScore(value: number, b: Band): number {
  const lerp = (x: number, from: number, to: number, a: number, z: number) =>
    to === from ? z : a + ((x - from) / (to - from)) * (z - a);
  let s: number;
  if (value >= b.low && value <= b.high) s = 100;
  else if (value < b.low && value >= b.floor) s = lerp(value, b.floor, b.low, 50, 100);
  else if (value > b.high && value <= b.ceiling)
    s = lerp(value, b.high, b.ceiling, 100, 50);
  else if (value < b.floor) s = lerp(value, b.floor - (b.low - b.floor), b.floor, 0, 50);
  else s = lerp(value, b.ceiling, b.ceiling + (b.ceiling - b.high), 50, 0);
  return Math.round(Math.max(0, Math.min(100, s)));
}
