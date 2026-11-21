/**
 * A saved pasto as the one meal box draws it (PAT-30; target.md B1–B2): one porzione judged
 * as the day judges a logged meal (each food with all its estimates), its nutrients, its cibi
 * and what it costs. Pure: the page reads, this composes. Used by the pasto's page and by its
 * row in the Elenco, so both say the same.
 */
import { type BoxDetails, type BoxEntry, type NutrientsData } from "@lifeos/kit";
import { common } from "@/i18n/common";
import type { WeightBook } from "@/core/account/weights";
import type { readMicroTargets } from "@/core/day";
import type { readTargetsFor } from "@/core/energy";
import type { FoodChoice, RecipeChoice } from "@/core/food/choices";
import { costWords, entryCost } from "@/core/food/cost";
import {
  mealFoods,
  mealKinds,
  mealNutrients,
  mealTotals,
} from "@/features/food/composer";
import { linesScore } from "@/features/food/lines-score";
import { microsOf } from "@/features/day/nutrients";
import { dayMicros } from "@/core/food/micros";
import type { LibraryRow } from "@/features/library/library";

export type MealRefs = {
  targets: Awaited<ReturnType<typeof readTargetsFor>>;
  micros: Awaited<ReturnType<typeof readMicroTargets>>;
  /** Every estimate of each food, by food id (`readFoodEstimates`). */
  estimates: ReadonlyMap<string, Record<string, string>>;
  weights?: WeightBook;
};

export function mealBox(
  recipe: RecipeChoice,
  by: ReadonlyMap<string, FoodChoice>,
  refs: MealRefs,
): {
  data: NutrientsData;
  score: BoxEntry["score"] | undefined;
  details: BoxDetails;
  parts: NonNullable<LibraryRow["meal"]>["parts"];
} {
  const used = recipe.parts.flatMap((l) => {
    const f = by.get(l.key);
    return f ? [{ line: l, food: f }] : [];
  });
  const lines = recipe.parts;
  const data = recipe.estimate
    ? mealNutrients(
        Object.fromEntries(
          Object.entries(recipe.estimate).map(([f, v]) => [f, Number(v)]),
        ),
      )
    : {
        ...mealNutrients(
          mealTotals(lines, by),
          mealKinds(lines, by),
          mealFoods(lines, by),
        ),
        // its vitamins and minerals, for the «Micro» cell (his §174), against the day's need
        micros: microsOf(
          dayMicros([
            {
              servings: null,
              lines: used.map((u) => ({
                quantity: u.line.quantity,
                values: u.food.per100,
                ...(u.food.foodId && refs.estimates.get(u.food.foodId)
                  ? { estimates: refs.estimates.get(u.food.foodId)! }
                  : {}),
              })),
            },
          ]),
          refs.micros,
        ),
      };
  const score = recipe.estimate
    ? undefined
    : linesScore(
        used.map((u) => ({
          key: u.line.key,
          quantity: u.line.quantity,
          values: u.food.per100,
          estimates: u.food.foodId ? refs.estimates.get(u.food.foodId) : undefined,
        })),
        null,
        refs.targets,
        refs.micros,
        null,
        null,
        refs.weights?.["food"],
      );
  const cost = costWords(
    entryCost(
      used.map((u) => ({
        quantity: u.line.quantity,
        values: u.food.per100,
        name: u.food.name,
      })),
    ),
  );
  const parts = used.map((u) => ({
    name: u.food.name,
    brand: u.food.brand ?? "",
    quantity: u.line.quantity,
    unit: u.food.unit,
    href: u.food.foodId ? "/cibo/cibo/" + u.food.foodId : null,
    of: u.food.drawing ?? {},
  }));
  return {
    data,
    score,
    details: {
      stats: cost ? [{ label: common.doors.cost, value: cost }] : [],
      lines: parts.map((p) => ({ label: p.name, value: p.quantity })),
      foot: "",
    },
    parts,
  };
}
