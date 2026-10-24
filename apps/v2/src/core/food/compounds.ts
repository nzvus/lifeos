/**
 * core/food/compounds.ts — what a food carries besides nutrients (kinds.md
 * «compounds»: caffeine in mg, creatine in g, per 100 of the food; v1's
 * ingredient compounds), summed over a meal's lines, and the caffeine still
 * in the body at a later time (dossiers/ranges.md §5): each dose halves
 * every 5 h, an average (2–10 h between people; EFSA 2015) said as an
 * estimate.
 */
export const COMPOUND_FIELDS = ["caffeine", "creatine"] as const;
export type Compound = (typeof COMPOUND_FIELDS)[number];

export const CAFFEINE_HALF_LIFE_H = 5;

type Line = { itemId: string | null; quantity: string };

/** A meal's caffeine (mg) and creatine (g), from its foods' compounds; 0 when none. */
export function mealCompounds(
  lines: readonly Line[],
  servings: string | null,
  compounds: ReadonlyMap<string, Record<string, string>>,
): Record<Compound, number> {
  const times = Number(servings ?? "1");
  const out: Record<Compound, number> = { caffeine: 0, creatine: 0 };
  for (const l of lines) {
    const c = l.itemId ? compounds.get(l.itemId) : undefined;
    if (!c) continue;
    for (const k of COMPOUND_FIELDS)
      if (c[k] !== undefined) out[k] += (Number(c[k]) * Number(l.quantity) * times) / 100;
  }
  return out;
}

/** The caffeine left at `at` from doses taken before it, in mg. */
export function caffeineLeft(
  doses: readonly { at: Date; mg: number }[],
  at: Date,
): number {
  return doses.reduce((left, d) => {
    const h = (at.getTime() - d.at.getTime()) / 3_600_000;
    return h < 0 ? left : left + d.mg * 0.5 ** (h / CAFFEINE_HALF_LIFE_H);
  }, 0);
}
