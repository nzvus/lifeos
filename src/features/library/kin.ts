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
