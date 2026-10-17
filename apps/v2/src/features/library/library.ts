/**
 * features/library/library.ts — Libreria's lists (V-07, first part): foods
 * and products per 100, saved meals per serving (their parts' totals), each
 * a row searched by its words and sorted by use, name, or a nutrient alone
 * or per 100 kcal (v1's metrics). Pure, so the list sorts as you tap.
 */
import { fold, type FoodChoice, type RecipeChoice } from "@/core/food/choices";
import { lineTotals } from "@/core/food/totals";

export type LibraryRow = {
  key: string;
  /** Its page, when it has one. */
  href?: string;
  name: string;
  /** A food's products, or a saved meal's foods. */
  sub: string;
  uses: number;
  /** Field → number: per 100 for a food, per serving for a saved meal. */
  values: Record<string, number>;
};

export const SORTS = {
  uses: "Più usati",
  name: "Nome",
  kcal: "Kcal",
  protein: "Proteine",
  proteinPerKcal: "Proteine per 100 kcal",
  fibre: "Fibre",
} as const;
export type SortKey = keyof typeof SORTS;

const nums = (v: Record<string, string>) =>
  Object.fromEntries(Object.entries(v).map(([f, x]) => [f, Number(x)]));

/** The foods, each once: its products (ADR-0055) are counted under it, their uses added. */
export function foodRows(foods: readonly FoodChoice[]): LibraryRow[] {
  const products = foods.filter((f) => f.productId !== null);
  return foods
    .filter((f) => f.productId === null)
    .map((f) => {
      const own = products.filter((p) => p.foodId === f.foodId);
      return {
        key: f.key,
        ...(f.foodId ? { href: "/libreria/cibo/" + f.foodId } : {}),
        name: f.name,
        sub:
          own.length === 0
            ? ""
            : own.length === 1
              ? "1 prodotto"
              : own.length + " prodotti",
        uses: f.uses + own.reduce((n, p) => n + p.uses, 0),
        values: nums(f.per100),
      };
    });
}

export function recipeRows(
  recipes: readonly RecipeChoice[],
  foods: readonly FoodChoice[],
): LibraryRow[] {
  const by = new Map(foods.map((f) => [f.key, f]));
  return recipes.map((r) => {
    const parts = r.parts.flatMap((p) => {
      const f = by.get(p.key);
      return f ? [{ quantity: p.quantity, values: f.per100, name: f.name }] : [];
    });
    return {
      key: r.key,
      name: r.name,
      sub: parts.map((p) => p.name).join(", "),
      uses: r.uses,
      values: nums(lineTotals(parts)),
    };
  });
}

/** The sort's number for a row; null when the row has no value for it. */
export function sortValue(r: LibraryRow, s: SortKey): number | null {
  if (s === "proteinPerKcal") {
    const k = r.values["kcal"];
    const p = r.values["protein"];
    return k && p !== undefined ? (p / k) * 100 : null;
  }
  if (s === "uses" || s === "name") return null;
  return r.values[s] ?? null;
}

/** Rows holding every word typed, in the sort's order (highest first; no value last). */
export function listRows(
  rows: readonly LibraryRow[],
  query: string,
  s: SortKey,
): LibraryRow[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const byName = (a: LibraryRow, b: LibraryRow) => a.name.localeCompare(b.name, "it");
  return rows
    .filter((r) => words.every((w) => fold(r.name + " " + r.sub).includes(w)))
    .sort((a, b) => {
      if (s === "name") return byName(a, b);
      if (s === "uses") return b.uses - a.uses || byName(a, b);
      const x = sortValue(a, s);
      const y = sortValue(b, s);
      if (x === null || y === null)
        return (x === null ? 1 : 0) - (y === null ? 1 : 0) || byName(a, b);
      return y - x || byName(a, b);
    });
}

/** A food's values per 100, in the label's order: [field, words, unit]. */
export const FOOD_FIELDS: [string, string, string][] = [
  ["kcal", "Energia", "kcal"],
  ["protein", "Proteine", "g"],
  ["carbs", "Carboidrati", "g"],
  ["sugars", "di cui zuccheri", "g"],
  ["fat", "Grassi", "g"],
  ["saturatedFat", "di cui saturi", "g"],
  ["fibre", "Fibre", "g"],
  ["salt", "Sale", "g"],
  ["nova", "NOVA", ""],
];

export type FoodPage = {
  name: string;
  unit: string;
  per100: Record<string, string>;
  products: { brand: string; uses: number }[];
  /** The saved meals with it, and how much of it each has. */
  meals: { name: string; quantity: string }[];
};

/** A food's page (V-07, first part): its values, its products, the saved meals that use it. */
export function foodPage(
  foods: readonly FoodChoice[],
  recipes: readonly RecipeChoice[],
  foodId: string,
): FoodPage | null {
  const food = foods.find((f) => f.foodId === foodId && f.productId === null);
  if (!food) return null;
  const keys = new Set(foods.filter((f) => f.foodId === foodId).map((f) => f.key));
  return {
    name: food.name,
    unit: food.unit,
    per100: food.per100,
    products: foods
      .filter((f) => f.foodId === foodId && f.productId !== null)
      .map((f) => ({ brand: f.brand ?? "", uses: f.uses })),
    meals: recipes.flatMap((r) => {
      const part = r.parts.find((p) => keys.has(p.key));
      return part ? [{ name: r.name, quantity: part.quantity }] : [];
    }),
  };
}
