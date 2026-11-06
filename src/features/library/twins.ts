/**
 * features/library/twins.ts — «Possibili doppioni» (ADR-0060 slice f,
 * dossiers/objects.md §6, his 17 near-duplicates): pairs of foods whose names
 * share their head word, and pairs of saved meals that share most of their
 * foods, each with what the agent proposes (a brand of the other, one thing
 * to merge, a variant), never one he said are different. Pure.
 */
import { brandInName } from "@/core/catalog/brand-of";
import { fold, type FoodChoice, type RecipeChoice } from "@/core/food/choices";
import { foodTwins } from "./library";

export type Twin =
  | {
      kind: "food";
      a: { id: string; name: string };
      b: { id: string; name: string };
      propose: "brand" | "merge" | null;
      brand: string | null;
    }
  | {
      kind: "meal";
      base: { id: string; name: string };
      child: { id: string; name: string };
    };

const pair = (a: string, b: string) => [a, b].sort().join("|");
/** «Burro d'arachidi» and «Burro di arachidi» are the same words. */
const plain = (n: string) =>
  fold(n)
    .replace(/\b(d|di|de|del|della)\b|'/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function twinPairs(
  foods: readonly FoodChoice[],
  recipes: readonly RecipeChoice[],
  notTwins: ReadonlySet<string>,
): Twin[] {
  const out: Twin[] = [];
  const seen = new Set<string>();
  for (const f of foods) {
    if (f.productId !== null || !f.foodId) continue;
    for (const t of foodTwins(foods, f.foodId)) {
      const key = pair(f.foodId, t.id);
      if (seen.has(key) || notTwins.has(key)) continue;
      seen.add(key);
      const [a, b] = [{ id: f.foodId, name: f.name }, t];
      const brandA = brandInName(a.name);
      const brandB = brandInName(b.name);
      // The one with a brand in its name is the brand of the other.
      const branded = brandA && !brandB ? a : brandB && !brandA ? b : null;
      const other = branded === a ? b : a;
      const named = branded ? plain(branded.name.replace(/\([^)]*\)\s*$/, "")) : "";
      const near = branded && plain(other.name).startsWith(named.split(" ")[0] ?? "");
      // Only what has a proposal: a brand in the name, or the same words (his list stays short).
      if (branded && near)
        out.push({
          kind: "food",
          a: branded,
          b: other,
          propose: "brand",
          brand: brandInName(branded.name),
        });
      else if (plain(a.name) === plain(b.name))
        out.push({ kind: "food", a, b, propose: "merge", brand: null });
    }
  }
  // Saved meals: a family is those with the same first word that share at least two
  // foods with the smallest of them, its base; the others are proposed as its variants.
  const foodsOf = (r: RecipeChoice) => new Set(r.parts.map((p) => p.key.split(":")[0]));
  const live = recipes.filter((r) => !r.baseId && r.parts.length > 0);
  const heads = new Map<string, RecipeChoice[]>();
  for (const r of live) {
    const h = fold(r.name).split(/[^a-z0-9]+/)[0] ?? "";
    if (h.length >= 3) heads.set(h, [...(heads.get(h) ?? []), r]);
  }
  for (const group of heads.values()) {
    if (group.length < 2) continue;
    const base = [...group].sort(
      (x, y) => foodsOf(x).size - foodsOf(y).size || y.uses - x.uses,
    )[0]!;
    const core = foodsOf(base);
    for (const r of group) {
      if (r === base || notTwins.has(pair(r.recipeId, base.recipeId))) continue;
      const shared = [...foodsOf(r)].filter((k) => core.has(k)).length;
      if (shared >= Math.min(2, core.size))
        out.push({
          kind: "meal",
          base: { id: base.recipeId, name: base.name },
          child: { id: r.recipeId, name: r.name },
        });
    }
  }
  return out;
}

/** English names his converted data still has, and the Italian one they merge into (TRAIN-02). */
const SAME_EXERCISE: [string, string][] = [
  ["run", "corsa"],
  ["treadmill", "tapis roulant"],
  ["walk", "camminata"],
];

/** Exercises that are one with another under an English name (R5, TRAIN-37): keep the Italian. */
export function exerciseTwins(
  exercises: readonly { id: string; name: string }[],
  notTwins: ReadonlySet<string>,
): { keep: { id: string; name: string }; gone: { id: string; name: string } }[] {
  const by = (n: string) => exercises.find((e) => fold(e.name).trim() === n);
  return SAME_EXERCISE.flatMap(([en, it]) => {
    const gone = by(en);
    const keep = by(it);
    return gone && keep && !notTwins.has(pair(gone.id, keep.id))
      ? [
          {
            keep: { id: keep.id, name: keep.name },
            gone: { id: gone.id, name: gone.name },
          },
        ]
      : [];
  });
}
