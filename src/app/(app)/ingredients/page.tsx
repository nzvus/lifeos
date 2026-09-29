/**
 * app/(app)/ingredients/page.tsx — URL /ingredients: every ingredient, with
 * instant search and smart ordering (features/.../IngredientBrowser), most
 * used in the last 60 days first.
 */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import { getUsage, USAGE_WINDOW_DAYS } from "@/core/nutrition/repositories/usage";
import { addDays, todayIn } from "@/core/shared/dates";
import { IngredientBrowser } from "@/features/nutrition/ingredients/IngredientBrowser";

export default async function IngredientsPage() {
  const { owner, settings, t } = await requireContext();
  const db = getDb();
  const [ingredients, usage] = await Promise.all([
    listIngredients(db, owner),
    getUsage(db, owner, addDays(todayIn(settings.timezone), -USAGE_WINDOW_DAYS)),
  ]);
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{t.ingredients.title}</h1>
        <Link
          href="/ingredients/new"
          className="bg-herb px-3 py-1 font-display text-lg font-semibold text-sheet"
        >
          {t.ingredients.newTitle}
        </Link>
      </div>
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
          fat: i.fat,
          fiber: i.fiber,
          packagePriceCents: i.packagePriceCents,
          packageSize: i.packageSize,
        }))}
        usage={usage.ingredients}
        locale={settings.locale}
        t={{
          ingredients: t.ingredients,
          nutrients: t.nutrients,
          search: t.search,
          macro: t.macro,
        }}
      />
    </>
  );
}
