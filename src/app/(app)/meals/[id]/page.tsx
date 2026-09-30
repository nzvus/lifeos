/** app/(app)/meals/[id]/page.tsx — URL /meals/<id>: edit or delete a meal. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getMeal } from "@/core/nutrition/repositories/meals";
import { Big } from "@/core/shared/decimal";
import { idInput } from "@/core/nutrition/validation";
import { MealForm } from "@/features/nutrition/meals/MealForm";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import { deleteMealAction, updateMealAction } from "../actions";
import { mealEditorIngredients } from "../ingredient-options";

type Props = { params: Promise<{ id: string }> };

export default async function EditMealPage({ params }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const db = getDb();
  const [meal, ingredients] = await Promise.all([
    getMeal(db, owner, id),
    mealEditorIngredients(owner, settings),
  ]);
  if (!meal) notFound();

  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <Link href="/meals" className="text-meta underline">
        {t.meals.back}
      </Link>
      <h1 className="font-display text-title font-bold">{t.meals.editTitle}</h1>
      <MealForm
        action={updateMealAction.bind(null, id)}
        ingredients={ingredients}
        initial={{
          name: meal.name,
          notes: meal.notes,
          // "60.00" from the database is shown as "60" in the field.
          items: meal.lines.map((l) => ({
            ingredientId: l.ingredientId,
            quantity: new Big(l.quantity).toString(),
          })),
        }}
        submitLabel={t.meals.save}
        t={{
          meals: t.meals,
          errors: t.errors,
          search: t.search,
          macro: t.macro,
          ingredients: t.ingredients,
        }}
      />
      <ActionButtonForm action={deleteMealAction.bind(null, id)} label={t.meals.delete} />
    </div>
  );
}
