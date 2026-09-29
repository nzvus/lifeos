/**
 * app/(app)/meals/new/page.tsx — URL /meals/new. A meal is made of
 * ingredients, so with none yet the page says so instead of an unusable form.
 */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import { MealForm } from "@/features/nutrition/meals/MealForm";
import { createMealAction } from "../actions";

export default async function NewMealPage() {
  const { owner, t } = await requireContext();
  const ingredients = await listIngredients(getDb(), owner);
  return (
    <>
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
          ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
          initial={{ name: "", notes: "", items: [] }}
          submitLabel={t.meals.create}
          t={t}
        />
      )}
    </>
  );
}
