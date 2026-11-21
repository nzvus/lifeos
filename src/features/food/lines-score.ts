/**
 * features/food/lines-score.ts — a meal's score (E7 FOOD) from its lines:
 * pure, no database, so the composer scores the meal as it is built and Oggi
 * scores the logged one the same way (dossiers/meal-score.md §8).
 */
import type { BoxEntry } from "@lifeos/kit";
import type { FoodTargets } from "@/core/day";
import { FOOD, score, type Weights } from "@/core/engines/judgements";
import type { MicroTarget } from "@/core/engines/targets";
import { foodParts, lineShares, partsOf, type MealWhen } from "@/core/food/score";

export const PART_WORDS: Record<string, string> = {
  density: "densità di nutrienti",
  limits: "limiti",
  value: "valore",
  fit: "adatto al piano",
  carbsQuality: "qualità dei carboidrati",
  fatQuality: "qualità dei grassi",
  satiety: "sazietà",
  variety: "varietà",
  timing: "momento",
};
/** Each criterion's short name, for its tile (his §189, V-A). */
export const PART_SHORT: Record<string, string> = {
  density: "densità",
  limits: "limiti",
  value: "valore",
  fit: "piano",
  carbsQuality: "q. carbo",
  fatQuality: "q. grassi",
  satiety: "sazietà",
  variety: "varietà",
  timing: "momento",
};
/**
 * Which criteria each misura feeds (FD-51; his §181, §189 «filtro»): a misura picked lights
 * these, a criterion picked lights the misure that feed it. The kcal feed every criterion «per
 * 100 kcal»; here only those they decide.
 */
export const MISURA_FEEDS: Record<string, string[]> = {
  kcal: ["fit", "variety", "timing"],
  protein: ["density", "satiety", "fit", "timing"],
  carbs: ["carbsQuality", "limits"],
  fat: ["fatQuality", "limits", "density"],
  fiber: ["density", "satiety", "carbsQuality"],
  micro: ["density", "limits"],
};
/** Why a criterion does not count for this meal (his 19 Nov: «che significa "senza: …"?»). */
const MISSING_WHY: Record<string, string> = {
  value: "manca il prezzo",
  fit: "non è un pasto del piano",
  timing: "conta vicino all'allenamento o al sonno",
};
const LIMIT_WORDS: Record<string, string> = {
  sodium: "sale",
  saturated: "grassi saturi",
  freeSugars: "zuccheri liberi",
  trans: "grassi trans",
};

/** «Come valutiamo», one model at a time (`?modello=`). */
const HOW = "/oggi/andamento/come-valutiamo?modello=";

export function linesScore(
  lines: Parameters<typeof foodParts>[0],
  servings: string | null,
  targets: FoodTargets | null,
  microTargets: readonly MicroTarget[] | null,
  fit: number | null = null,
  /** When it is eaten (after training, near bedtime): «momento»; null leaves it out. */
  when: MealWhen | null = null,
  /** The person's weights for FOOD (V-16); missing: the defaults. */
  weights?: Weights,
): BoxEntry["score"] | undefined {
  if (targets === null) return undefined;
  const refs = {
    kcal: targets.kcal,
    // A day without a protein or fibre target: that nutrient is left out of density.
    protein: targets.protein ?? 0,
    fibre: targets.fibre ?? 0,
    micros: Object.fromEntries((microTargets ?? []).map((t) => [t.micro, t.value])),
  };
  const parts = foodParts(lines, servings, refs, when);
  // Without density (too few nutrients known) only the limits would speak: «no excess» is
  // not «good food» (a cake scored 100 on them alone). No score then.
  if (!parts || parts.density === null) return undefined;
  const s = score(FOOD, { ...partsOf(parts), fit }, weights);
  if (s.value === null) return undefined;
  // Each line's share of each criterion's input (MOD-61): the link the voto bar draws.
  const shares = lineShares(lines, servings, refs, when);
  const split = (key: string) => {
    const xs = shares[key] ?? [];
    return xs.length === lines.length && lines.length > 1
      ? { split: Object.fromEntries(lines.map((l, i) => [l.key ?? String(i), xs[i]!])) }
      : {};
  };
  // Over its allowance: the limit that decided it, by name.
  const worst = Object.entries(parts.detail.limits).sort((a, b) => b[1] - a[1])[0];
  const over = worst && worst[1] > 1 ? " · " + (LIMIT_WORDS[worst[0]] ?? worst[0]) : "";
  return {
    value: s.value,
    parts: s.parts.map((p) => ({
      name: (PART_WORDS[p.key] ?? p.key) + (p.key === "limits" ? over : ""),
      key: p.key,
      short: PART_SHORT[p.key] ?? p.key,
      score: p.score,
      weight: p.weight,
      ...split(p.key),
    })),
    missing: s.missing.map(
      (k) => (PART_WORDS[k] ?? k) + " (" + (MISSING_WHY[k] ?? "pochi dati") + ")",
    ),
    how: HOW + FOOD.id,
  };
}
