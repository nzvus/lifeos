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
import { readExerciseLog, readExercises } from "@/core/training";
import {
  exerciseRows,
  foodRows,
  recipeRows,
  shelfLines,
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
) {
  const foods = await readFoodChoices(db, owner, today);
  const [recipes, exercises, log] = await Promise.all([
    readRecipeChoices(db, owner, today, foods),
    readExercises(db, owner),
    readExerciseLog(db, owner),
  ]);
  const scored = scoreFoods
    ? await Promise.all([
        readTargetsFor(db, owner, today, today, clock),
        readMicroTargets(db, owner, today),
        readFoodEstimates(
          db,
          owner,
          foods.flatMap((f) => (f.productId === null && f.foodId ? [f.foodId] : [])),
        ),
      ])
    : null;
  const food = foodRows(foods).map((r) => {
    const id = r.href?.split("/").at(-1);
    const sc =
      scored && id
        ? foodScore(
            Object.fromEntries(Object.entries(r.values).map(([k, v]) => [k, String(v)])),
            scored[2].get(id),
            scored[0],
            scored[1],
            r.of?.["group"],
            weights,
          )
        : undefined;
    return sc ? { ...r, score: sc } : r;
  });
  const meal = recipeRows(recipes, foods);
  const exercise = exerciseRows(exercises, log, (d) => F.Day(d));
  return {
    lists: { foods: food, meals: meal, exercises: exercise } satisfies Record<
      LibraryView,
      unknown
    >,
    shelfLines: shelfLines(foods, meal, exercise),
  };
}
