/**
 * app/(app)/ingredients/[id]/page.tsx — URL /ingredients/<id>[?from=PATH]:
 * edit, or move to the trash (ADR-0015).
 *
 * `[id]` is a dynamic segment: Next.js passes the URL part as params.id. The
 * id is untrusted input: it's validated as a UUID (a malformed one would make
 * Postgres throw) and the lookup is owner-checked, so someone else's id gives
 * the same 404 as a non-existent one.
 */
import { notFound } from "next/navigation";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { mealsUsing } from "@/core/nutrition/preview";
import {
  compoundsOf,
  getIngredient,
  listTags,
  tagsByIngredient,
} from "@/core/nutrition/repositories/ingredients";
import { listMeals } from "@/core/nutrition/repositories/meals";
import { idInput, ingredientFormValues } from "@/core/nutrition/validation";
import { IngredientForm } from "@/features/nutrition/ingredients/IngredientForm";
import { safeFrom } from "@/core/shared/navigation";
import {
  deleteIngredientAction,
  restoreIngredientAction,
  updateIngredientAction,
} from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function EditIngredientPage({ params, searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const { id } = await params;
  if (!idInput.safeParse(id).success) notFound();
  const from = safeFrom((await searchParams).from, "/ingredients");
  const db = getDb();
  const [ingredient, meals, knownTags, tagMap, compounds] = await Promise.all([
    getIngredient(db, owner, id),
    listMeals(db, owner),
    listTags(db, owner),
    tagsByIngredient(db, owner),
    compoundsOf(db, owner, [id]),
  ]);
  if (!ingredient) notFound();

  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <IngredientForm
        id={id}
        title={t.ingredients.editTitle}
        from={from}
        action={updateIngredientAction.bind(null, id)}
        trash={deleteIngredientAction}
        restore={restoreIngredientAction}
        initial={ingredientFormValues({ ...ingredient, ...compounds.get(id) })}
        locale={settings.locale}
        usedIn={mealsUsing(meals, id)}
        tags={(tagMap.get(id) ?? []).map(({ name, icon }) => ({ name, icon }))}
        knownTags={knownTags.map(({ name, icon }) => ({ name, icon }))}
        t={{
          ingredients: t.ingredients,
          nutrients: t.nutrients,
          errors: t.errors,
          macro: t.macro,
          quality: t.quality,
          actions: t.actions,
        }}
      />
    </div>
  );
}
