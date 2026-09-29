/**
 * app/(app)/ingredients/page.tsx — URL /ingredients: the list, and a link to
 * add a new one.
 */
import Link from "next/link";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import { IngredientList } from "@/features/nutrition/ingredients/IngredientList";

export default async function IngredientsPage() {
  const { owner, settings, t } = await requireContext();
  const ingredients = await listIngredients(getDb(), owner);
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
      <IngredientList ingredients={ingredients} locale={settings.locale} t={t} />
    </>
  );
}
