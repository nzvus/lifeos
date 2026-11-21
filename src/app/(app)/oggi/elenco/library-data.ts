/**
 * The catalogs' rows, read once for Oggi · Elenco (every shelf, one search) and
 * for an area's Elenco (its shelves only, map D): foods scored per 100 kcal
 * against today's targets only when their list is shown. Server only.
 */
import { F } from "@lifeos/kit";
import type { requireOwner } from "@/app/_server/owner";
import type { getDb } from "@/app/_server/runtime";
import type { IsoDate } from "@/core/engines/time";
import {
  readFoodChoices,
  readFoodEstimates,
  readRecipeChoices,
} from "@/core/food/catalog";
import { readMicroTargets } from "@/core/day";
import { readTargetsFor } from "@/core/energy";
import { foodScore } from "@/features/day/score";
import { mealBox } from "./meal-box";
import { areaSlug, typeAtSlug } from "@/core/kinds/catalog";
import { pageVerbs } from "@/features/objects/present";
import { NEW_FORMS } from "../../[area]/[type]/[id]/new-forms";
import { EQUIPMENT_WORDS, PATTERN_WORDS } from "@/i18n/training";
import { mealKinds, mealNutrients } from "@/features/food/composer";
import { readExerciseLog, readExercises } from "@/core/training";
import {
  exerciseRows,
  foodRows,
  recipeRows,
  shelfLines,
  type LibraryRow,
  type LibraryView,
} from "@/features/library/library";

type Db = Awaited<ReturnType<typeof getDb>>;
type Owner = Awaited<ReturnType<typeof requireOwner>>;

export async function readLibrary(
  db: Db,
  owner: Owner,
  today: IsoDate,
  clock: Parameters<typeof readTargetsFor>[4],
  weights: Parameters<typeof foodScore>[5],
  scoreFoods: boolean,
  /** «Pasti salvati» shown: each row carries its box, to open in place (PAT-43). */
  openMeals = false,
) {
  const foods = await readFoodChoices(db, owner, today);
  const [recipes, exercises, log] = await Promise.all([
    readRecipeChoices(db, owner, today, foods),
    readExercises(db, owner),
    readExerciseLog(db, owner),
  ]);
  // Read once for whichever list is judged: the foods per 100 kcal, the pasti per porzione.
  const refs =
    scoreFoods || openMeals
      ? await (async () => {
          const [targets, micros, estimates] = await Promise.all([
            readTargetsFor(db, owner, today, today, clock),
            readMicroTargets(db, owner, today),
            readFoodEstimates(
              db,
              owner,
              foods.flatMap((f) => (f.productId === null && f.foodId ? [f.foodId] : [])),
            ),
          ]);
          return { targets, micros, estimates, ...(weights ? { weights } : {}) };
        })()
      : null;
  const by = new Map(foods.map((f) => [f.key, f]));
  // One thing judged and drawn per 100 g: a cibo, or one of its marche (PAT-30, §130).
  const judge = (
    key: string,
    values: Record<string, number>,
    id: string | undefined,
    group?: string,
  ) => {
    const sc =
      scoreFoods && refs && id
        ? foodScore(
            Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])),
            refs.estimates.get(id),
            refs.targets,
            refs.micros,
            group,
            weights,
          )
        : undefined;
    return {
      ...(sc ? { score: sc } : {}),
      data: mealNutrients(values, mealKinds([{ key, quantity: "100" }], by)),
      ...(values["nova"] ? { nova: values["nova"] } : {}),
    };
  };
  const food = foodRows(foods).map((r) => {
    const id = r.href?.split("/").at(-1);
    if (!scoreFoods) return r;
    const own = judge(r.key, r.values, id, r.of?.["group"]);
    // A cibo opens in place (PAT-30 level 1, Deliver ③); each marca redraws it when picked (§130).
    return {
      ...r,
      ...(own.score ? { score: own.score } : {}),
      food: { data: own.data, ...(own.nova ? { nova: own.nova } : {}) },
      ...(r.products
        ? {
            products: r.products.map((p) => ({
              ...p,
              box: judge(p.key, p.values, id, r.of?.["group"]),
            })),
          }
        : {}),
    };
  });
  const meal = recipeRows(recipes, foods).map((r, i) => {
    if (!openMeals || !refs) return r;
    const recipe = recipes[i]!;
    const box = mealBox(recipe, by, refs);
    return {
      ...r,
      ...(box.score ? { score: box.score } : {}),
      meal: {
        id: recipe.recipeId,
        estimate: recipe.estimate !== undefined,
        data: box.data,
        details: box.details,
        parts: box.parts,
      },
    };
  });
  const exercise = exerciseRows(
    exercises,
    log,
    (d) => F.Day(d),
    (x) => [
      ...(x.pattern ? [PATTERN_WORDS[x.pattern] ?? x.pattern] : []),
      ...(x.equipment ? [EQUIPMENT_WORDS[x.equipment] ?? x.equipment] : []),
    ],
  );
  return {
    lists: {
      foods: withObjects(food),
      meals: withObjects(meal),
      exercises: withObjects(exercise),
    } satisfies Record<LibraryView, unknown>,
    shelfLines: shelfLines(foods, meal, exercise),
  };
}

/**
 * Each row's object, read from its page's address (`/{area}/{type}/{id}`, PAT-04): its type, id
 * and the verbs its page offers, for its box's actions row (PAT-101, MOD-20).
 */
function withObjects(rows: LibraryRow[]): LibraryRow[] {
  return rows.map((r) => {
    const [, , slug, id] = (r.href ?? "").split("/");
    const t = slug ? typeAtSlug(slug) : null;
    if (!t || !id) return r;
    return {
      ...r,
      obj: {
        type: t.key,
        id,
        typeName: t.name,
        verbs: pageVerbs(t, NEW_FORMS[t.key]?.from ?? [], rows.length > 1),
        newHref: `/${areaSlug(t)}/${slug}/nuovo`,
      },
    };
  });
}
