/**
 * app/(app)/meals/new/page.tsx — URL /meals/new. A meal is made of
 * ingredients, so with none yet the page says so instead of an unusable form.
 */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { MealForm } from "@/features/nutrition/meals/MealForm";
import { createMealAction } from "../actions";
import { mealEditorIngredients } from "../ingredient-options";

export default async function NewMealPage() {
  const { owner, settings, t } = await requireContext();
  const ingredients = await mealEditorIngredients(owner, settings);
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <Link href="/meals" className="text-sm underline">
        {t.meals.back}
      </Link>
      <h1 className="font-display text-3xl font-bold">{t.meals.newTitle}</h1>
      {ingredients.length === 0 ? (
        <p className="text-muted">
          {t.meals.needIngredients}{" "}
          <Link href="/ingredients/new" className="underline">
            {t.ingredients.newTitle}
          </Link>
        </p>
      ) : (
        <MealForm
          action={createMealAction}
          ingredients={ingredients}
          initial={{ name: "", notes: "", items: [] }}
          submitLabel={t.meals.create}
          t={{
            meals: t.meals,
            errors: t.errors,
            search: t.search,
            macro: t.macro,
            ingredients: t.ingredients,
          }}
        />
      )}
    </div>
  );
}
