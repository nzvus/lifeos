/**
 * core/nutrition/day-score.ts — the day's quality score, 0–100, and its
 * breakdown (ADR-0012 follow-up; the developer asked for "never a black
 * box"). Computed on read from what was EATEN; nothing is stored, so the
 * formula can change without touching data.
 *
 *   targets      40 %  share of the nutrients with a target that are on
 *                      target (min reached, max not passed, target ±5 %)
 *   processing   35 %  energy from NOVA 1–2 counts fully, NOVA 3 half,
 *                      NOVA 4 not at all; unclassified energy is left out
 *   fiberVariety 25 %  fibre types with at least 1 g: 0, 1, 2, 3, 4+ →
 *                      0, 40, 70, 90, 100
 *
 * A part that can't be computed (no targets; nothing classified) is left
 * out and the others are re-weighted; the breakdown says which and why.
 */
import { Big } from "../shared/decimal";
import { NUTRIENT_KEYS, type NutrientKey } from "./nutrients";
import { FIBER_TYPES } from "./quality";
import type { QualitySummary } from "./quality-summary";
import { assessTarget, TARGET_KIND, type Targets } from "./targets";

export const SCORE_WEIGHTS = { targets: 40, processing: 35, fiberVariety: 25 } as const;
export type ScoreKey = keyof typeof SCORE_WEIGHTS;

export type ScorePart = {
  key: ScoreKey;
  /** 0–100, or null when it can't be computed (see `reason`). */
  value: number | null;
  /** The weight actually used, after leaving out the missing parts (sums to 100). */
  weight: number;
  reason: "no_targets" | "not_classified" | null;
  /** What the value is made of, for the words on screen. */
  detail: { on?: number; of?: number; types?: number };
};

export type DayScore = { score: number | null; parts: ScorePart[] };

const VARIETY = [0, 40, 70, 90, 100];

export function dayScore(input: {
  totals: Record<NutrientKey, string>;
  targets: Targets;
  quality: QualitySummary;
}): DayScore {
  // Targets met.
  let on = 0;
  let of = 0;
  for (const k of NUTRIENT_KEYS) {
    const a = assessTarget(input.totals[k], input.targets[k], TARGET_KIND[k]);
    if (a.status === "none") continue;
    of++;
    if (a.status === "on") on++;
  }
  const targets: ScorePart = {
    key: "targets",
    value: of === 0 ? null : Math.round((on / of) * 100),
    weight: 0,
    reason: of === 0 ? "no_targets" : null,
    detail: { on, of },
  };

  // Processing, over the classified energy only.
  const n = input.quality.nova;
  const classified = n[1] + n[2] + n[3] + n[4];
  const processing: ScorePart = {
    key: "processing",
    value:
      classified === 0
        ? null
        : Math.round(((n[1] + n[2] + n[3] * 0.5) / classified) * 100),
    weight: 0,
    reason: classified === 0 ? "not_classified" : null,
    detail: {},
  };

  // Fibre variety.
  const types = FIBER_TYPES.filter((f) => new Big(input.quality.fiber[f]).gte(1)).length;
  const fiberVariety: ScorePart = {
    key: "fiberVariety",
    value: VARIETY[Math.min(types, 4)]!,
    weight: 0,
    reason: null,
    detail: { types },
  };

  const parts = [targets, processing, fiberVariety];
  const present = parts.filter((p) => p.value !== null);
  const total = present.reduce((sum, p) => sum + SCORE_WEIGHTS[p.key], 0);
  for (const p of present) p.weight = Math.round((SCORE_WEIGHTS[p.key] / total) * 100);
  const score =
    present.length === 0
      ? null
      : Math.round(
          present.reduce((sum, p) => sum + p.value! * SCORE_WEIGHTS[p.key], 0) / total,
        );
  return { score, parts };
}
