/**
 * E5 Targets — the slots of a day (engines.md E5): a meal block's shares ×
 * the day's targets, and hints from its relations (E1 tags):
 *   pre-workout   carbs 0.5–1 g/kg, 1–3 h before
 *   post-workout  protein 0.25–0.4 g/kg, within 2 h
 *   pre-sleep     protein ≈ 0.4 g/kg (≈ 30–40 g)
 * Sources: ISSN 2017 nutrient timing (Kerksick 2017); Snijders 2019 (pre-sleep protein).
 * Hints are shown next to the slot; they never change the day's totals.
 */
import type { DayTargets } from "./day";

export type SlotTargets = { kcal: number; protein: number; carbs: number; fat: number };

/**
 * A slot's targets: kcal and protein by its shares; carbs and fat follow the kcal share.
 * A share left out takes the kcal share (protein spread like the energy).
 */
export function slotTargets(
  day: DayTargets,
  shares: { kcal?: number; protein?: number },
): SlotTargets {
  const k = shares.kcal ?? 0;
  const p = shares.protein ?? k;
  return {
    kcal: Math.round(day.kcal * k),
    protein: Math.round(day.protein * p),
    carbs: Math.round(day.carbs * k),
    fat: Math.round(day.fat * k),
  };
}

export type Hint = {
  tag: string;
  nutrient: "carbs" | "protein";
  low: number;
  high: number;
};

const HINTS: Record<string, { nutrient: Hint["nutrient"]; low: number; high: number }> = {
  "pre-workout": { nutrient: "carbs", low: 0.5, high: 1 },
  "post-workout": { nutrient: "protein", low: 0.25, high: 0.4 },
  "pre-sleep": { nutrient: "protein", low: 0.35, high: 0.45 },
};

/** The hints for a slot's relation tags, in grams for this weight. */
export function slotHints(tags: readonly string[], weightKg: number): Hint[] {
  return tags.flatMap((tag) => {
    const h = HINTS[tag];
    return h
      ? [
          {
            tag,
            nutrient: h.nutrient,
            low: Math.round(h.low * weightKg),
            high: Math.round(h.high * weightKg),
          },
        ]
      : [];
  });
}

/** Shares of a day's slots that do not add up to 1 (e.g. 0.95 or 1.1): the editor says so. */
export function sharesOff(shares: readonly { kcal?: number }[]): number | null {
  const sum = shares.reduce((a, s) => a + (s.kcal ?? 0), 0);
  return Math.abs(sum - 1) < 0.005 ? null : Math.round(sum * 100) / 100;
}
