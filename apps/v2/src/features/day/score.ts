/**
 * features/day/score.ts — a meal's score on the day (E7 «Food and meal»,
 * core/food `foodParts`; dossiers/meal-score.md): the parts in words with
 * their weights, for the box's skyline and its open parts. None without the
 * day's targets (no references to judge against) or for a meal under 5 kcal.
 */
import type { BoxEntry } from "@lifeos/kit";
import type { DayItem, FoodTargets } from "@/core/day";
import { FOOD, score } from "@/core/engines/judgements";
import type { MicroTarget } from "@/core/engines/targets";
import { foodParts, partsOf } from "@/core/food/score";

const PART_WORDS: Record<string, string> = {
  density: "densità",
  limits: "limiti",
  value: "valore",
  fit: "adatto al blocco",
};
const LIMIT_WORDS: Record<string, string> = {
  sodium: "sale",
  saturated: "grassi saturi",
  freeSugars: "zuccheri liberi",
  trans: "grassi trans",
};

export function mealScore(
  meal: DayItem,
  targets: FoodTargets | null,
  estimates: ReadonlyMap<string, Record<string, string>>,
  microTargets: readonly MicroTarget[] | null,
): BoxEntry["score"] | undefined {
  if (meal.kind.key !== "meal" || targets === null) return undefined;
  const parts = foodParts(
    meal.lines.map((l) => ({
      quantity: l.quantity,
      values: l.values,
      estimates: l.itemId ? estimates.get(l.itemId) : undefined,
    })),
    typeof meal.values["servings"] === "string" ? meal.values["servings"] : null,
    {
      kcal: targets.kcal,
      // A day without a protein or fibre target: that nutrient is left out of density.
      protein: targets.protein ?? 0,
      fibre: targets.fibre ?? 0,
      micros: Object.fromEntries((microTargets ?? []).map((t) => [t.micro, t.value])),
    },
  );
  if (!parts) return undefined;
  const s = score(FOOD, partsOf(parts));
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
