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
      out.push(
        branded && near
          ? {
              kind: "food",
              a: branded,
              b: other,
              propose: "brand",
              brand: brandInName(branded.name),
            }
          : {
              kind: "food",
              a,
              b,
              propose: plain(a.name) === plain(b.name) ? "merge" : null,
              brand: null,
            },
      );
    }
  }
  // Saved meals: two that share most of their foods are a base and a variant.
  const foodsOf = (r: RecipeChoice) => new Set(r.parts.map((p) => p.key.split(":")[0]));
  const live = recipes.filter((r) => !r.baseId && r.parts.length > 0);
  for (const r of live)
    for (const o of live) {
      if (r.recipeId >= o.recipeId) continue;
      const key = pair(r.recipeId, o.recipeId);
      if (notTwins.has(key)) continue;
      const [x, y] = [foodsOf(r), foodsOf(o)];
      const shared = [...x].filter((k) => y.has(k)).length;
      const head = fold(r.name).split(" ")[0] === fold(o.name).split(" ")[0];
      if (!head || shared < 2 || shared < Math.min(x.size, y.size) - 1) continue;
      const [base, child] = x.size <= y.size ? [r, o] : [o, r];
      out.push({
        kind: "meal",
        base: { id: base.recipeId, name: base.name },
        child: { id: child.recipeId, name: child.name },
      });
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
