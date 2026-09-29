/** app/(app)/meals/[id]/page.tsx — URL /meals/<id>: edit or delete a meal. */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import { getMeal } from "@/core/nutrition/repositories/meals";
import { Big } from "@/core/shared/decimal";
import { idInput } from "@/core/nutrition/validation";
import { MealForm } from "@/features/nutrition/meals/MealForm";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import { deleteMealAction, updateMealAction } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function EditMealPage({ params }: Props) {
  const { owner, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const db = getDb();
  const [meal, ingredients] = await Promise.all([
    getMeal(db, owner, id),
    listIngredients(db, owner),
  ]);
  if (!meal) notFound();

  return (
    <>
      <Link href="/meals" className="text-sm underline">
        {t.meals.back}
      </Link>
      <h1 className="font-display text-3xl font-bold">{t.meals.editTitle}</h1>
      <MealForm
        action={updateMealAction.bind(null, id)}
        ingredients={ingredients.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
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
        t={t}
      />
      <ActionButtonForm action={deleteMealAction.bind(null, id)} label={t.meals.delete} />
    </>
  );
}
