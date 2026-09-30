/**
 * app/(app)/ingredients/[id]/page.tsx — URL /ingredients/<id>: edit or delete.
 *
 * `[id]` is a dynamic segment: Next.js passes the URL part as params.id. The
 * id is untrusted input: it's validated as a UUID (a malformed one would make
 * Postgres throw) and the lookup is owner-checked, so someone else's id gives
 * the same 404 as a non-existent one.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getIngredient } from "@/core/nutrition/repositories/ingredients";
import { idInput, ingredientFormValues } from "@/core/nutrition/validation";
import { IngredientForm } from "@/features/nutrition/ingredients/IngredientForm";
import { ActionButtonForm } from "@/ui/ActionButtonForm";
import { deleteIngredientAction, updateIngredientAction } from "../actions";

type Props = { params: Promise<{ id: string }> };

export default async function EditIngredientPage({ params }: Props) {
  const { owner, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const ingredient = await getIngredient(getDb(), owner, id);
  if (!ingredient) notFound();

  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <Link href="/ingredients" className="text-meta underline">
        {t.ingredients.back}
      </Link>
      <h1 className="font-display text-title font-bold">{t.ingredients.editTitle}</h1>
      <IngredientForm
        action={updateIngredientAction.bind(null, id)}
        initial={ingredientFormValues(ingredient)}
        submitLabel={t.ingredients.save}
        t={{ ingredients: t.ingredients, nutrients: t.nutrients, errors: t.errors }}
      />
      <ActionButtonForm
        action={deleteIngredientAction.bind(null, id)}
        label={t.ingredients.delete}
      />
    </div>
  );
}
