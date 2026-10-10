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
 *            = top of good: more is only energy (ADR-0040: drawn up to
 *            the day's carbs target, which takes the rest of the energy)
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

export function macroBands(input: {
  kg: number;
  /** The day's energy target, kcal (2000 when there is none). */
  kcal: number | null;
  load: TrainingLoad;
  /** A deficit keeps protein higher. */
  cutting: boolean;
  /**
   * ADR-0040: the day's carbs target, g. The good zone reaches it: carbs
   * above the training band are energy, not a problem.
   */
  carbsTarget?: number | null;
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
      high: r(Math.max(130, cHi * kg, input.carbsTarget ?? 0)),
      ceiling: r(Math.max(130, cHi * kg, input.carbsTarget ?? 0)),
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

/**
 * How far "to go" counts while a nutrient is short: to the day's target
 * when there is one, since that is the number shown next to it, else to
 * where the good zone starts. Never less than the zone's start. Before
 * the 2026-10-10 audit it counted to the zone, so it read "4 g to go,
 * target 189" with 151 g eaten.
 */
export function toGoFrom(
  target: number | string | null | undefined,
  zoneLow: number,
): number {
  return target === null || target === undefined
    ? zoneLow
    : Math.max(Number(target), zoneLow);
}

/**
 * A nutrient's band on a day: its own (macros) or one from its target —
 * energy ±5 % good, −15 % floor, +10 % ceiling; a maximum (sugars, salt) good
 * up to it; a minimum good from it to +50 %. Null without either.
 */
export function bandFor(
  own: Band | undefined,
  target: number | null,
  kind: "min" | "max" | "target",
): Band | null {
  if (own) return own;
  if (target === null || target === 0) return null;
  if (kind === "max")
    return { floor: 0, low: 0, high: target, ceiling: target, ceilingKind: "health" };
  if (kind === "min")
    return {
      floor: 0,
      low: target,
      high: target * 1.5,
      ceiling: target * 1.5,
      ceilingKind: "useful",
    };
  return {
    floor: target * 0.85,
    low: target * 0.95,
    high: target * 1.05,
    ceiling: target * 1.1,
    ceilingKind: "health",
  };
}

/** "colour = state" (ADR-0025 follow-up): what a value's bar says. */
export type BandState = "none" | "short" | "good" | "high" | "over";

export function bandState(value: number, band: Band | null): BandState {
  if (!band) return "none";
  if (value < band.low) return "short";
  if (value <= band.high) return "good";
  if (value <= band.ceiling || band.ceilingKind === "useful") return "high";
  return "over";
}
