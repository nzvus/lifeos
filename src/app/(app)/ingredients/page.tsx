/**
 * app/(app)/ingredients/page.tsx — URL /ingredients: every ingredient, with
 * instant search and smart ordering (features/.../IngredientBrowser), most
 * used in the last 60 days first.
 */
import { requireContext } from "@/app/_server/owner";
import { PageHeader } from "@/ui/PageHeader";
import { FoodNav } from "@/features/nutrition/nav/FoodNav";
import { QuickIngredient } from "@/features/nutrition/ingredients/QuickIngredient";
import { getDb } from "@/app/_server/runtime";
import {
  listIngredients,
  tagsByIngredient,
} from "@/core/nutrition/repositories/ingredients";
import { getUsage, USAGE_WINDOW_DAYS } from "@/core/nutrition/repositories/usage";
import { addDays, todayIn } from "@/core/shared/dates";
import {
  createIngredientAction,
  deleteIngredientAction,
  restoreIngredientAction,
} from "./actions";
import { IngredientBrowser } from "@/features/nutrition/ingredients/IngredientBrowser";

export default async function IngredientsPage() {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const [ingredients, usage, tagMap] = await Promise.all([
    listIngredients(db, owner),
    getUsage(db, owner, addDays(todayIn(settings.timezone), -USAGE_WINDOW_DAYS)),
    tagsByIngredient(db, owner),
  ]);
  return (
    <>
      {/* The pantry (ADR-0017) is a view of the Food tab, beside these. */}
      <FoodNav current="ingredients" t={t} />
      <PageHeader title={t.ingredients.title} />
      <QuickIngredient id="new-ingredient" action={createIngredientAction} t={t} />
      <IngredientBrowser
        // Only the fields the list shows are sent to the browser.
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          unit: i.unit,
          kcal: i.kcal,
          protein: i.protein,
          carbs: i.carbs,
          sugars: i.sugars,
          fat: i.fat,
          saturatedFat: i.saturatedFat,
          fiber: i.fiber,
          salt: i.salt,
          nova: i.nova,
          origin: i.origin,
          fiberTypes: i.fiberTypes,
          tags: (tagMap.get(i.id) ?? []).map(({ name, icon }) => ({ name, icon })),
          packagePriceCents: i.packagePriceCents,
          packageSize: i.packageSize,
        }))}
        usage={usage.ingredients}
        locale={settings.locale}
        initialSort={{
          sort: settings.preferences.listSort,
          per: settings.preferences.listPer,
        }}
        t={{
          ingredients: t.ingredients,
          nutrients: t.nutrients,
          search: t.search,
          macro: t.macro,
          quality: t.quality,
          actions: t.actions,
        }}
        trash={deleteIngredientAction}
        restore={restoreIngredientAction}
      />
    </>
  );
}
