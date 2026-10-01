/**
 * app/(app)/log/[id]/page.tsx — URL /log/<entry id>[?from=…]: a day's food
 * entry edited as a LOCAL COPY (ADR-0022): grams, swaps, added or removed
 * ingredients, servings. The meal it came from does not change.
 */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { getLogEntry } from "@/core/nutrition/repositories/log";
import { safeFrom } from "@/core/shared/navigation";
import { EntryEditor } from "@/features/nutrition/log/EntryEditor";
import { mealEditorIngredients } from "../../meals/ingredient-options";
import { editEntryAction } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function EditEntryPage({ params, searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  const entry = await getLogEntry(getDb(), owner, id);
  if (!entry || entry.estimated || entry.batchId) notFound();
  const from = safeFrom((await searchParams).from, `/?day=${entry.day}`);
  const ingredients = await mealEditorIngredients(owner, settings);
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <EntryEditor
        id={entry.id}
        title={entry.label}
        fromMeal={entry.mealId !== null}
        from={from}
        action={editEntryAction.bind(null, entry.id)}
        ingredients={ingredients}
        initial={{
          servings: String(Number(entry.servings)),
          items: entry.lines.map((l) => ({
            itemId: l.itemId,
            ingredientId: l.ingredientId ?? "",
            quantity: String(Number(l.quantity)),
            name: l.name,
            unit: l.unit,
            values: {
              kcal: l.per100.kcal,
              protein: l.per100.protein,
              carbs: l.per100.carbs,
              fat: l.per100.fat,
              fiber: l.per100.fiber,
            },
          })),
        }}
        locale={settings.locale}
        t={{
          meals: t.meals,
          errors: t.errors,
          search: t.search,
          macro: t.macro,
          ingredients: t.ingredients,
          nutrients: t.nutrients,
          actions: t.actions,
          day: t.day,
          entryEdit: t.entryEdit,
        }}
      />
    </div>
  );
}
