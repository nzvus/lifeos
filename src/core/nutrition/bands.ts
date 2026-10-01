/**
 * core/nutrition/bands.ts — for each macro a FLOOR, a GOOD zone and a
 * CEILING (ADR-0023 as amended by ADR-0025), from body weight, energy, the
 * day's training and the goal.
 *
 *   floor    the minimum recommended for HEALTH (reference intakes)
 *   good     where the goal is best served (muscle, training)
 *   ceiling  the HEALTH maximum where one exists; otherwise the USEFUL
 *            maximum, beyond which there is no further benefit
 *
 *   protein  floor 0.8 g/kg (RDA, EFSA PRI 0.83) · good 1.6–2.2 g/kg
 *            (cut 1.8–2.4) · useful max = top of good: more adds no muscle
 *            (Morton 2018 meta-analysis; ISSN 2017)
 *   carbs    floor 130 g (RDA: the brain's glucose) · good by training:
 *            rest 2–3, training 3–5, long 5–7 g/kg (ACSM 2016) · useful max
 *            = top of good: more is only energy
 *   fat      floor 20 % of kcal (AMDR) · good 25–30 % of kcal, at least
 *            0.6 g/kg · health max 35 % of kcal (AMDR; EFSA RI 20–35 %)
 *   fibre    floor 25 g (EFSA adequate intake) · good 14 g/1000 kcal (at
 *            least 25) to 50 g · useful max 70 g (tolerance; no UL)
 *
 * Energy has no band: it has its own target. Sugars, saturated fat and salt
 * keep their health maxima (targets.ts).
 *
 * Pure; tested in bands.test.ts.
 */
import type { NutrientKey } from "./nutrients";

export type Band = {
  floor: number;
  low: number;
  high: number;
  ceiling: number;
  /** "health": a recommended maximum; "useful": no benefit beyond it. */
  ceilingKind: "health" | "useful";
};
export type Bands = Partial<Record<NutrientKey, Band>>;

/** rest: no training; training: up to ~90 min; long: 2 h, or 90+ min of cardio. */
export type TrainingLoad = "rest" | "training" | "long";

export function trainingLoad(minutes: number, cardioMinutes: number): TrainingLoad {
  if (minutes >= 120 || cardioMinutes >= 90) return "long";
  return minutes > 0 ? "training" : "rest";
}

const CARBS: Record<TrainingLoad, [number, number]> = {
  rest: [2, 3],
  training: [3, 5],
  long: [5, 7],
};

const r = (x: number) => Math.round(x);

/** The top of the carbs' good zone, g: where a dynamic target stops. */
export function carbsGoodMax(kg: number, load: TrainingLoad): number {
  return r(CARBS[load][1] * kg);
}

export function macroBands(input: {
  kg: number;
  /** The day's energy target, kcal (2000 when there is none). */
  kcal: number | null;
  load: TrainingLoad;
  /** A deficit keeps protein higher. */
  cutting: boolean;
}): Bands {
  const { kg, load, cutting } = input;
  const kcal = input.kcal ?? 2000;
  const pLow = (cutting ? 1.8 : 1.6) * kg;
  const pHigh = (cutting ? 2.4 : 2.2) * kg;
  const [cLo, cHi] = CARBS[load];
  const fatLow = Math.max(0.6 * kg, (kcal * 0.25) / 9);
  return {
    protein: {
      floor: r(0.8 * kg),
      low: r(pLow),
      high: r(pHigh),
      ceiling: r(pHigh),
      ceilingKind: "useful",
    },
    carbs: {
      floor: 130,
      low: r(Math.max(130, cLo * kg)),
      high: r(Math.max(130, cHi * kg)),
      ceiling: r(Math.max(130, cHi * kg)),
      ceilingKind: "useful",
    },
    fat: {
      floor: r((kcal * 0.2) / 9),
      low: r(fatLow),
      high: r(Math.max(fatLow, (kcal * 0.3) / 9)),
      ceiling: r(Math.max(fatLow, (kcal * 0.35) / 9)),
      ceilingKind: "health",
    },
    fiber: {
      floor: 25,
      low: r(Math.max(25, (14 * kcal) / 1000)),
      high: 50,
      ceiling: 70,
      ceilingKind: "useful",
    },
  };
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
 * at the floor or the ceiling, to 0 as far again beyond them. Past a USEFUL
 * ceiling nothing is gained but nothing is harmed: 70, not lower.
 */
export function zoneScore(value: number, b: Band): number {
  const lerp = (x: number, from: number, to: number, a: number, z: number) =>
    to === from ? z : a + ((x - from) / (to - from)) * (z - a);
  let s: number;
  if (value >= b.low && value <= b.high) s = 100;
  else if (value < b.low && value >= b.floor) s = lerp(value, b.floor, b.low, 50, 100);
  else if (value < b.floor) s = lerp(value, b.floor - (b.low - b.floor), b.floor, 0, 50);
  else if (b.ceilingKind === "useful") s = 70;
  else if (value <= b.ceiling) s = lerp(value, b.high, b.ceiling, 100, 50);
  else s = lerp(value, b.ceiling, b.ceiling + (b.ceiling - b.high), 50, 0);
  return Math.round(Math.max(0, Math.min(100, s)));
}
