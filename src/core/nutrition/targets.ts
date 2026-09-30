/**
 * core/nutrition/targets.ts — how a day's total relates to its target, and
 * which targets apply when the user set none.
 *
 * 1. KINDS. Not every target means the same thing:
 *    - "min"    reaching it is the goal, going above is fine (protein, fibre);
 *    - "max"    staying under is the goal, going above is not (sugars,
 *               saturated fat, salt);
 *    - "target" getting close matters from both sides (energy, carbs, fat).
 *    The UI colours by kind, so "over" is red only where over is bad.
 *
 * 2. AUTO TARGETS. For sugars, saturated fat and salt, if the day's profile
 *    has no value, a recommended maximum applies (marked "auto" in the UI):
 *    - sugars: EU reference intake, 90 g total sugars per 2000 kcal
 *      (Regulation (EU) 1169/2011, Annex XIII), scaled to the energy target;
 *    - saturated fat: < 10% of energy (WHO), i.e. energy × 0.10 / 9 kcal per g;
 *    - salt: < 5 g per day (WHO).
 *    Without an energy target, 2000 kcal (the reference) is used for scaling.
 *
 * Pure; tested in targets.test.ts.
 */
import { Big, toFixedDisplay } from "../shared/decimal";
import { NUTRIENT_KEYS, type NutrientKey } from "./nutrients";

export type TargetKind = "min" | "max" | "target";

export const TARGET_KIND: Record<NutrientKey, TargetKind> = {
  kcal: "target",
  protein: "min",
  carbs: "target",
  sugars: "max",
  fat: "target",
  saturatedFat: "max",
  fiber: "min",
  salt: "max",
};

/** How close "close" is for kind "target": within ±5 %. */
const TOLERANCE = 0.05;

export type Assessment =
  | { status: "none" }
  | {
      /** under: not there yet · on: where it should be · over: past it (bad for max/target, fine for min) */
      status: "under" | "on" | "over";
      /** total / target, e.g. 0.82 or 1.3 (for drawing and colouring). */
      ratio: number;
      /** |target − total|, rounded for display. */
      delta: string;
    };

export function assessTarget(
  total: string,
  target: string | null,
  kind: TargetKind,
): Assessment {
  if (target === null) return { status: "none" };
  const goal = new Big(target);
  if (goal.eq(0)) return { status: "none" };
  const t = new Big(total);
  const ratio = t.div(goal).toNumber();
  const delta = toFixedDisplay(t.minus(goal).abs());
  let status: "under" | "on" | "over";
  if (kind === "min") status = ratio >= 1 ? "on" : "under";
  else if (kind === "max") status = ratio > 1 ? "over" : "on";
  else status = ratio < 1 - TOLERANCE ? "under" : ratio > 1 + TOLERANCE ? "over" : "on";
  return { status, ratio, delta };
}

export type Targets = Record<NutrientKey, string | null>;

/** Targets with the recommended maxima filled in where the user set none. */
export function withAutoTargets(targets: Targets): {
  targets: Targets;
  auto: NutrientKey[];
} {
  const energy = new Big(targets.kcal ?? "2000");
  const auto: NutrientKey[] = [];
  const out = { ...targets };
  const fill = (k: NutrientKey, value: Big) => {
    if (out[k] === null) {
      out[k] = value.round(1, Big.roundHalfUp).toString();
      auto.push(k);
    }
  };
  fill("sugars", energy.div(2000).times(90));
  fill("saturatedFat", energy.times("0.10").div(9));
  fill("salt", new Big(5));
  // Keep the canonical order of NUTRIENT_KEYS in `auto` (stable UI).
  return { targets: out, auto: NUTRIENT_KEYS.filter((k) => auto.includes(k)) };
}
