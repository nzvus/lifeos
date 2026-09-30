/**
 * app/(app)/meals/new/page.tsx — URL /meals/new. A meal is made of
 * ingredients, so with none yet the page says so instead of an unusable form.
 */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { PageHeader } from "@/ui/PageHeader";
import { MealForm } from "@/features/nutrition/meals/MealForm";
import { createMealAction } from "../actions";
import { mealEditorIngredients } from "../ingredient-options";
import { getDb } from "@/app/_server/runtime";
import { listFactors } from "@/core/nutrition/repositories/ratings";

export default async function NewMealPage() {
  const { owner, settings, t } = await requireContext();
  const [ingredients, factors] = await Promise.all([
    mealEditorIngredients(owner, settings),
    listFactors(getDb(), owner),
  ]);
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={t.meals.newTitle}
        back={{ href: "/meals", label: t.meals.back }}
      />
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
          initial={{
            name: "",
            notes: "",
            category: "",
            review: "",
            ratings: {},
            items: [],
          }}
          submitLabel={t.meals.create}
          locale={settings.locale}
          factors={factors}
          t={{
            meals: t.meals,
            moments: t.moments,
            ratings: t.ratings,
            nutrients: t.nutrients,
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
