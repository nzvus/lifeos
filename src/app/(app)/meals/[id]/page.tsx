/**
 * app/(app)/meals/[id]/page.tsx — URL /meals/<id>[?from=PATH]: edit a meal,
 * duplicate it, or move it to the trash (ADR-0015). `from` is where back,
 * Cancel and saving lead (the meals list when absent).
 */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getMeal } from "@/core/nutrition/repositories/meals";
import { listFactors, ratingsByMeal } from "@/core/nutrition/repositories/ratings";
import { idInput } from "@/core/nutrition/validation";
import { Big } from "@/core/shared/decimal";
import { safeFrom } from "@/core/shared/navigation";
import { MealForm } from "@/features/nutrition/meals/MealForm";
import { deleteMealAction, restoreMealAction, updateMealAction } from "../actions";
import { mealEditorIngredients } from "../ingredient-options";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function EditMealPage({ params, searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const from = safeFrom((await searchParams).from, "/meals");
  const db = getDb();
  const [meal, ingredients, factors, ratings] = await Promise.all([
    getMeal(db, owner, id),
    mealEditorIngredients(owner, settings),
    listFactors(db, owner),
    ratingsByMeal(db, owner),
  ]);
  if (!meal) notFound();

  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <MealForm
        id={id}
        title={t.meals.editTitle}
        from={from}
        action={updateMealAction.bind(null, id)}
        trash={deleteMealAction}
        restore={restoreMealAction}
        ingredients={ingredients}
        initial={{
          name: meal.name,
          notes: meal.notes,
          category: meal.category ?? "",
          review: meal.review,
          ratings: ratings.get(id) ?? {},
          // "60.00" from the database is shown as "60" in the field.
          items: meal.lines.map((l) => ({
            ingredientId: l.ingredientId,
            quantity: new Big(l.quantity).toString(),
          })),
        }}
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
          actions: t.actions,
        }}
      />
    </div>
  );
}
