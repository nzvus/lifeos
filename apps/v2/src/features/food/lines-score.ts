/**
 * features/food/lines-score.ts — a meal's score (E7 FOOD) from its lines:
 * pure, no database, so the composer scores the meal as it is built and Oggi
 * scores the logged one the same way (dossiers/meal-score.md §8).
 */
import type { BoxEntry } from "@lifeos/kit";
import type { FoodTargets } from "@/core/day";
import { FOOD, score } from "@/core/engines/judgements";
import type { MicroTarget } from "@/core/engines/targets";
import { foodParts, partsOf, type MealWhen } from "@/core/food/score";

export const PART_WORDS: Record<string, string> = {
  density: "densità",
  limits: "limiti",
  value: "valore",
  fit: "adatto al blocco",
  carbsQuality: "qualità dei carboidrati",
  fatQuality: "qualità dei grassi",
  satiety: "sazietà",
  variety: "varietà",
  timing: "momento",
};
const LIMIT_WORDS: Record<string, string> = {
  sodium: "sale",
  saturated: "grassi saturi",
  freeSugars: "zuccheri liberi",
  trans: "grassi trans",
};

export function linesScore(
  lines: Parameters<typeof foodParts>[0],
  servings: string | null,
  targets: FoodTargets | null,
  microTargets: readonly MicroTarget[] | null,
  fit: number | null = null,
  /** When it is eaten (after training, near bedtime): «momento»; null leaves it out. */
  when: MealWhen | null = null,
): BoxEntry["score"] | undefined {
  if (targets === null) return undefined;
  const parts = foodParts(
    lines,
    servings,
    {
      kcal: targets.kcal,
      // A day without a protein or fibre target: that nutrient is left out of density.
      protein: targets.protein ?? 0,
      fibre: targets.fibre ?? 0,
      micros: Object.fromEntries((microTargets ?? []).map((t) => [t.micro, t.value])),
    },
    when,
  );
  // Without density (too few nutrients known) only the limits would speak: «no excess» is
  // not «good food» (a cake scored 100 on them alone). No score then.
  if (!parts || parts.density === null) return undefined;
  const s = score(FOOD, { ...partsOf(parts), fit });
  if (s.value === null) return undefined;
  // Over its allowance: the limit that decided it, by name.
  const worst = Object.entries(parts.detail.limits).sort((a, b) => b[1] - a[1])[0];
  const over = worst && worst[1] > 1 ? " · " + (LIMIT_WORDS[worst[0]] ?? worst[0]) : "";
  return {
    value: s.value,
    parts: s.parts.map((p) => ({
      name: (PART_WORDS[p.key] ?? p.key) + (p.key === "limits" ? over : ""),
      score: p.score,
      weight: p.weight,
    })),
    missing: s.missing.map((k) => PART_WORDS[k] ?? k),
  };
}
