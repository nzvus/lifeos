/** app/(app)/ingredients/new/page.tsx — URL /ingredients/new[?from=PATH]: empty form. */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listTags } from "@/core/nutrition/repositories/ingredients";
import { safeFrom } from "@/core/shared/navigation";
import { IngredientForm } from "@/features/nutrition/ingredients/IngredientForm";
import { createIngredientAction } from "../actions";

type Props = { searchParams: Promise<{ from?: string }> };

export default async function NewIngredientPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const from = safeFrom((await searchParams).from, "/ingredients");
  const knownTags = await listTags(getDb(), owner);
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <IngredientForm
        title={t.ingredients.newTitle}
        from={from}
        action={createIngredientAction}
        initial={{ unit: "g" }}
        locale={settings.locale}
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
