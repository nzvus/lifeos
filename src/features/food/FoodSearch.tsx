"use client";
/**
 * The food composer's search (PAT-41, PAT-62; change 2026-11-07-food-meal): the kit's `Find`.
 * Ingredienti: one row per food (its brands are aliases), so a brand shows only when the words
 * typed name it («passata mutti» adds the Mutti one, as `collapseBrands` did); at rest the most
 * eaten (FD-93). Pasti: his saved meals, each base with its variants. Beside it the barcode;
 * when nothing matches, «Crea «…»».
 */
import { find, Find, F, Glyph, type FindItem } from "@lifeos/kit";
import {
  fold,
  searchFoods,
  searchRecipes,
  type FoodChoice,
  type RecipeChoice,
} from "@/core/food/choices";
import { collapseBrands, recipeMeta, withVariants } from "./LinePicks";

type Row = FindItem & { food?: FoodChoice; recipe?: RecipeChoice };

const per100 = (c: FoodChoice) =>
  c.per100["kcal"] === undefined ? "" : F.num(Number(c.per100["kcal"]), "kcal") + "/100";

/** The food a row adds: the brand the words name, else the food itself. */
export function pickedFood(
  row: FoodChoice,
  choices: readonly FoodChoice[],
  query: string,
): FoodChoice {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const named = choices.find(
    (c) =>
      c.foodId === row.foodId &&
      c.productId !== null &&
      !!c.brand &&
      words.some((w) => fold(c.brand!).includes(w)),
  );
  return named ?? row;
}

/** One row per food (products folded in as aliases); a product alone when its food has none. */
export function foodRows(choices: readonly FoodChoice[]): Row[] {
  const plain = new Set(choices.filter((c) => c.productId === null).map((c) => c.foodId));
  return choices
    .filter((c) => c.productId === null || !plain.has(c.foodId))
    .map((c) => ({
      id: c.key,
      name: c.name,
      aliases: choices
        .filter((x) => x.foodId === c.foodId && x.brand)
        .map((x) => x.brand!),
      uses: c.uses,
      meta: [c.brand, per100(c)].filter(Boolean).join(" · "),
      food: c,
    }));
}

export function FoodSearch({
  tab,
  choices,
  inMeal,
  recipes,
  by,
  hour,
  query,
  onQuery,
  onFood,
  onRecipe,
  scanHref,
  createHref,
}: {
  tab: "foods" | "meals";
  choices: readonly FoodChoice[];
  /** The keys already in the meal: not offered again. */
  inMeal: ReadonlySet<string>;
  recipes: readonly RecipeChoice[];
  by: ReadonlyMap<string, FoodChoice>;
  hour: number;
  query: string;
  onQuery: (q: string) => void;
  onFood: (c: FoodChoice) => void;
  onRecipe: (r: RecipeChoice) => void;
  scanHref: string;
  createHref: (name: string) => string;
}) {
  if (tab === "meals") {
    const rows = (rs: readonly RecipeChoice[]): Row[] =>
      withVariants(rs).map(({ r, variants, under }) => ({
        id: r.key,
        name: r.name,
        uses: r.uses,
        meta: recipeMeta(r, variants, under, by),
        recipe: r,
      }));
    return (
      <Find
        items={rows(recipes)}
        idle={rows(searchRecipes(recipes, "", 12))}
        label={"Cerca tra " + F.plural(recipes.length, "pasto", "pasti")}
        hour={hour}
        clearOnPick
        onQuery={onQuery}
        onPick={(r) => r.recipe && onRecipe(r.recipe)}
      />
    );
  }
  const free = choices.filter((c) => !inMeal.has(c.key));
  const items = foodRows(free);
  const idle = foodRows(
    collapseBrands(searchFoods(free, "", inMeal.size === 0 ? 8 : 4), ""),
  );
  const none = query.trim() !== "" && find(items, query, { hour }).length === 0;
  return (
    <div className="k-stack g2">
      <Find
        items={items}
        idle={idle}
        label={"Cerca tra " + F.plural(choices.length, "cibo", "cibi")}
        hour={hour}
        clearOnPick
        onQuery={onQuery}
        onPick={(r) => r.food && onFood(pickedFood(r.food, free, query))}
      />
      <div className="k-line g2 wrap">
        <a className="k-btn secondary" href={scanHref}>
          <Glyph of={{ ui: "scan" }} decorative /> Dal codice a barre
        </a>
        {none && (
          <a className="k-btn secondary" href={createHref(query.trim())}>
            Crea «{query.trim()}»
          </a>
        )}
      </div>
    </div>
  );
}
