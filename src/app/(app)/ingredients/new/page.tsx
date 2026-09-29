/** app/(app)/ingredients/new/page.tsx — URL /ingredients/new: empty form. */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { IngredientForm } from "@/features/nutrition/ingredients/IngredientForm";
import { createIngredientAction } from "../actions";

export default async function NewIngredientPage() {
  const { t } = await requireContext();
  return (
    <>
      <Link href="/ingredients" className="text-sm underline">
        {t.ingredients.back}
      </Link>
      <h1 className="font-display text-3xl font-bold">{t.ingredients.newTitle}</h1>
      <IngredientForm
        action={createIngredientAction}
        initial={{ unit: "g" }}
        submitLabel={t.ingredients.create}
        t={t}
      />
    </>
  );
}
