/**
 * features/library/library.ts — Libreria's lists (V-07, first part): foods
 * and products per 100, saved meals per serving (their parts' totals), each
 * a row searched by its words and sorted by use, name, or a nutrient alone
 * or per 100 kcal (v1's metrics). Pure, so the list sorts as you tap.
 */
import { fold, type FoodChoice, type RecipeChoice } from "@/core/food/choices";
import { lineTotals } from "@/core/food/totals";
import type { ExerciseSession } from "@/core/training";

export type LibraryRow = {
  key: string;
  /** Its page, when it has one. */
  href?: string;
  name: string;
  /** A food's products, or a saved meal's foods. */
  sub: string;
  /** Words it is found by and not shown: the names merged into it («Unisci»). */
  also?: string;
  uses: number;
  /** Field → number: per 100 for a food, per serving for a saved meal. */
  values: Record<string, number>;
  /** What picks its drawing: a food's group or dish, an exercise's pattern and equipment. */
  of?: Record<string, string>;
  /** A food's score per 100 kcal (E7), when the page could judge it. */
  score?: {
    value: number | null;
    parts: { name: string; score: number; weight: number }[];
    missing: string[];
  };
};

/** Libreria's lists by their `?vista=` (the index when absent). */
export const LIBRARY_VIEWS = {
  cibi: "foods",
  pasti: "meals",
  esercizi: "exercises",
} as const;
export type LibraryView = (typeof LIBRARY_VIEWS)[keyof typeof LIBRARY_VIEWS];

/** Each shelf's line on the index (the board: counts and what is used most). */
export function shelfLines(
  foods: readonly FoodChoice[],
  meals: readonly LibraryRow[],
  exercises: readonly LibraryRow[],
): Record<LibraryView, string> {
  const products = foods.filter((f) => f.productId !== null).length;
  const top = [...meals]
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 2)
    .map((m) => m.name.toLowerCase());
  const trained = exercises.filter((e) => e.uses > 0).length;
  return {
    foods: "ciò che mangi · " + (products === 1 ? "1 prodotto" : products + " prodotti"),
    meals: top.length
      ? "più usati: " + top.join(", ")
      : "i pasti che salvi dal compositore",
    exercises: trained + " con sessioni · record ed e1RM",
  };
}

export const SORTS = {
  uses: "Più usati",
  name: "Nome",
  kcal: "Kcal",
  protein: "Proteine",
  proteinPerKcal: "Proteine per 100 kcal",
  fibre: "Fibre",
  score: "Voto",
  e1rm: "e1RM",
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
        ...(f.drawing ? { of: f.drawing } : {}),
      };
    });
}

export function recipeRows(
  recipes: readonly RecipeChoice[],
  foods: readonly FoodChoice[],
): LibraryRow[] {
  const by = new Map(foods.map((f) => [f.key, f]));
  return recipes.map((r) => {
    if (r.estimate)
      return {
        key: r.key,
        href: "/libreria/pasto/" + r.recipeId,
        name: r.name,
        sub: "stima",
        uses: r.uses,
        values: nums(r.estimate),
      };
    const parts = r.parts.flatMap((p) => {
      const f = by.get(p.key);
      return f ? [{ quantity: p.quantity, values: f.per100, name: f.name }] : [];
    });
    return {
      key: r.key,
      href: "/libreria/pasto/" + r.recipeId,
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
  if (s === "score") return r.score?.value ?? null;
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
    .filter((r) =>
      words.every((w) => fold(r.name + " " + r.sub + " " + (r.also ?? "")).includes(w)),
    )
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

export type MealPage = {
  name: string;
  uses: number;
  /** A saved estimate: typed totals, no foods. */
  estimate: boolean;
  parts: {
    name: string;
    brand: string;
    quantity: string;
    unit: string;
    href: string | null;
  }[];
  totals: Record<string, number>;
};

/** A saved meal's page (V-07, first part): its foods and quantities, its totals per serving. */
export function mealPage(
  foods: readonly FoodChoice[],
  recipes: readonly RecipeChoice[],
  recipeId: string,
): MealPage | null {
  const r = recipes.find((x) => x.recipeId === recipeId);
  if (!r) return null;
  const by = new Map(foods.map((f) => [f.key, f]));
  return {
    name: r.name,
    uses: r.uses,
    estimate: r.estimate !== undefined,
    parts: r.parts.flatMap((p) => {
      const f = by.get(p.key);
      return f
        ? [
            {
              name: f.name,
              brand: f.brand ?? "",
              quantity: p.quantity,
              unit: f.unit,
              href: f.foodId ? "/libreria/cibo/" + f.foodId : null,
            },
          ]
        : [];
    }),
    totals: recipeRows([r], foods)[0]!.values,
  };
}

/** The exercises, each with its sessions (uses), its last day and the latest e1RM it has. */
export function exerciseRows(
  exercises: readonly {
    id: string;
    name: string;
    pattern?: string | null;
    equipment?: string | null;
    aliases?: readonly string[];
  }[],
  log: ReadonlyMap<string, readonly ExerciseSession[]>,
  dayWords: (day: string) => string,
): LibraryRow[] {
  return exercises.map((x) => {
    const sessions = log.get(x.id) ?? [];
    const last = sessions[0];
    const latest = sessions.find((s) => s.best !== null)?.best;
    return {
      key: x.id,
      href: "/libreria/esercizio/" + x.id,
      name: x.name,
      sub: last ? "ultima " + dayWords(last.day) : "mai fatto",
      ...(x.aliases?.length ? { also: x.aliases.join(" ") } : {}),
      uses: sessions.length,
      values: latest ? { e1rm: latest } : {},
      of: {
        ...(x.pattern ? { pattern: x.pattern } : {}),
        ...(x.equipment ? { equipment: x.equipment } : {}),
      },
    };
  });
}

/** Words too common in food names to say two foods are the same. */
const COMMON = new Set([
  "con",
  "senza",
  "alla",
  "allo",
  "alle",
  "agli",
  "del",
  "della",
  "dei",
  "delle",
  "fresco",
  "fresca",
  "fresche",
  "freschi",
  "intero",
  "intera",
  "light",
  "bio",
]);
const meaningful = (name: string) =>
  fold(name)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !COMMON.has(w));

/**
 * Foods that may be the same as this one («Unisci», capture.md §4): another
 * food (not a product) whose name holds the head word of this one's, or the
 * other way round. Italian food names start with what the food is («Caffè
 * macinato», «Capsula Caffè», «Latte scremato»): an adjective in common
 * («macinato») is not enough. The person decides; most alike first.
 */
export function foodTwins(
  foods: readonly FoodChoice[],
  foodId: string,
): { id: string; name: string }[] {
  const me = foods.find((f) => f.foodId === foodId && f.productId === null);
  if (!me) return [];
  const mine = meaningful(me.name);
  if (mine.length === 0) return [];
  return foods
    .filter((f) => f.productId === null && f.foodId && f.foodId !== foodId)
    .map((f) => {
      const theirs = meaningful(f.name);
      const head = theirs.includes(mine[0]!) || (!!theirs[0] && mine.includes(theirs[0]));
      return {
        id: f.foodId!,
        name: f.name,
        head,
        // Same first word («Latte …» and «Latte …») before a name that only holds it.
        same: theirs[0] === mine[0],
        shared: theirs.filter((w) => mine.includes(w)).length,
      };
    })
    .filter((f) => f.head)
    .sort(
      (a, b) =>
        Number(b.same) - Number(a.same) ||
        b.shared - a.shared ||
        a.name.localeCompare(b.name, "it"),
    )
    .map(({ id, name }) => ({ id, name }));
}
