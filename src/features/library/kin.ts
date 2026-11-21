/**
 * features/library/kin.ts — each pasto's parents and children for its box in the Elenco (MOD-23,
 * PAT-103, ADR-0065): the stored parent lines and the ones found from the foods, with names. Pure.
 */
import { childrenOf, kinship, type Part } from "@/core/catalog/family";
import type { RecipeChoice } from "@/core/food/choices";

export type KinLink = { id: string; name: string; k: number; stored: boolean };
export type MealKin = { parents: KinLink[]; children: KinLink[] };

const line = (partItemId: string, quantity: string | number): Part => ({
  partItemId,
  quantity: String(quantity),
  unit: "g",
  defaults: {},
});

export function pastoKin(recipes: readonly RecipeChoice[]): Map<string, MealKin> {
  const pasti = recipes
    .filter((r) => r.estimate === undefined)
    .map((r) => ({
      id: r.recipeId,
      own: (r.parents ?? []).map((p) => line(p.id, p.k)),
      foods: r.parts.map((p) => line(p.key, p.quantity)),
    }));
  const up = kinship(pasti);
  const down = childrenOf(up);
  const name = new Map(recipes.map((r) => [r.recipeId, r.name]));
  const named = (xs: readonly { id: string; k: number; stored: boolean }[] = []) =>
    xs.flatMap((x) => {
      const n = name.get(x.id);
      return n ? [{ ...x, name: n }] : [];
    });
  return new Map(
    pasti.map((p) => [
      p.id,
      { parents: named(up.get(p.id)), children: named(down.get(p.id)) },
    ]),
  );
}

export type IngredientLine = { key: string; quantity: number };
export type IngredientGroups = {
  /** Each parent (stored or found) with the foods that come from it, × its multiplier. */
  parents: {
    id: string;
    name: string;
    k: number;
    stored: boolean;
    foods: IngredientLine[];
  }[];
  /** The pasto's own foods: what is left once its parents' foods are taken out. */
  own: IngredientLine[];
};

/**
 * A pasto's foods split by where they come from (his §169: «quali ingredienti sono accomunati da
 * ogni genitore»): each parent's foods × k, then its own — the rest, within the 2 % a found link
 * allows (MOD-23). Pure.
 */
export function ingredientGroups(
  recipe: RecipeChoice,
  recipes: readonly RecipeChoice[],
  parents: readonly KinLink[],
): IngredientGroups {
  const left = new Map(recipe.parts.map((p) => [p.key, Number(p.quantity)]));
  const groups = parents.flatMap((k) => {
    const parent = recipes.find((r) => r.recipeId === k.id);
    if (!parent) return [];
    const foods = parent.parts.map((p) => ({
      key: p.key,
      quantity: +(Number(p.quantity) * k.k).toFixed(1),
    }));
    for (const f of foods) left.set(f.key, (left.get(f.key) ?? 0) - f.quantity);
    return [{ id: k.id, name: k.name, k: k.k, stored: k.stored, foods }];
  });
  const own = recipe.parts.flatMap((p) => {
    const q = left.get(p.key) ?? 0;
    return q > Number(p.quantity) * 0.02 ? [{ key: p.key, quantity: +q.toFixed(1) }] : [];
  });
  return { parents: groups, own };
}
