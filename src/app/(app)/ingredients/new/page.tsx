/** app/(app)/ingredients/new/page.tsx — URL /ingredients/new: empty form. */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listTags } from "@/core/nutrition/repositories/ingredients";
import { PageHeader } from "@/ui/PageHeader";
import { IngredientForm } from "@/features/nutrition/ingredients/IngredientForm";
import { createIngredientAction } from "../actions";

export default async function NewIngredientPage() {
  const { owner, settings, t } = await requireContext();
  const knownTags = await listTags(getDb(), owner);
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="flex max-w-page flex-col gap-8">
      <PageHeader
        title={t.ingredients.newTitle}
        back={{ href: "/ingredients", label: t.ingredients.back }}
      />
      <IngredientForm
        action={createIngredientAction}
        initial={{ unit: "g" }}
        submitLabel={t.ingredients.create}
        locale={settings.locale}
        knownTags={knownTags.map(({ name, icon }) => ({ name, icon }))}
        t={{
          ingredients: t.ingredients,
          nutrients: t.nutrients,
          errors: t.errors,
          macro: t.macro,
          quality: t.quality,
        }}
      />
    </div>
  );
}
