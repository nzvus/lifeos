/**
 * app/(app)/meals/ingredient-options.ts — the ingredient list the meal
 * editor offers, shared by /meals/new and /meals/[id] (one place, not two).
 *
 * Not a route: in the App Router only files named page/layout/route/... are
 * special, so this file is just a module colocated with the pages using it.
 * Server-only: it queries through core repositories.
 */
import { macroValues } from "@/core/nutrition/preview";
import "server-only";
import type { Owner } from "@/core/identity/owner";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import type { Settings } from "@/core/nutrition/repositories/settings";
import { getUsage, USAGE_WINDOW_DAYS } from "@/core/nutrition/repositories/usage";
import { addDays, todayIn } from "@/core/shared/dates";
import { formatNumber } from "@/core/shared/format";
import { getDb } from "@/app/_server/runtime";

export async function mealEditorIngredients(owner: Owner, settings: Settings) {
  const db = getDb();
  const [ingredients, usage] = await Promise.all([
    listIngredients(db, owner),
    getUsage(db, owner, addDays(todayIn(settings.timezone), -USAGE_WINDOW_DAYS)),
  ]);
  return ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    notes: i.description,
    unit: i.unit,
    kcal: formatNumber(i.kcal, settings.locale, 0),
    protein: formatNumber(i.protein, settings.locale, 0),
    // Exact per-100 values for the live serving preview.
    values: macroValues(i),
    uses: usage.ingredients[i.id]?.uses ?? 0,
    lastUsed: usage.ingredients[i.id]?.lastUsed ?? null,
  }));
}
