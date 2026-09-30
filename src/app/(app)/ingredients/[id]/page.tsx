/**
 * app/(app)/ingredients/[id]/page.tsx — URL /ingredients/<id>: edit or delete.
 *
 * `[id]` is a dynamic segment: Next.js passes the URL part as params.id. The
 * id is untrusted input: it's validated as a UUID (a malformed one would make
 * Postgres throw) and the lookup is owner-checked, so someone else's id gives
 * the same 404 as a non-existent one.
 */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { PageHeader } from "@/ui/PageHeader";
import { getDb } from "@/app/_server/runtime";
import { mealsUsing } from "@/core/nutrition/preview";
import { getIngredient } from "@/core/nutrition/repositories/ingredients";
import { listMeals } from "@/core/nutrition/repositories/meals";
import { idInput, ingredientFormValues } from "@/core/nutrition/validation";
import { IngredientForm } from "@/features/nutrition/ingredients/IngredientForm";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import { deleteIngredientAction, updateIngredientAction } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function EditIngredientPage({ params }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const db = getDb();
  const [ingredient, meals] = await Promise.all([
    getIngredient(db, owner, id),
    listMeals(db, owner),
  ]);
  if (!ingredient) notFound();

  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={t.ingredients.editTitle}
        back={{ href: "/ingredients", label: t.ingredients.back }}
      />
      <IngredientForm
        action={updateIngredientAction.bind(null, id)}
        initial={ingredientFormValues(ingredient)}
        submitLabel={t.ingredients.save}
        locale={settings.locale}
        usedIn={mealsUsing(meals, id)}
        t={{
          ingredients: t.ingredients,
          nutrients: t.nutrients,
          errors: t.errors,
          macro: t.macro,
        }}
      />
      <ActionButtonForm
        action={deleteIngredientAction.bind(null, id)}
        label={t.ingredients.delete}
      />
    </div>
  );
}
