/**
 * app/(app)/ingredients/new/page.tsx — URL /ingredients/new[?from=PATH]
 * [&barcode=CODE]: an empty form, or one filled from Open Food Facts for a
 * scanned barcode (values to check against the label before saving).
 */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listTags } from "@/core/nutrition/repositories/ingredients";
import { safeFrom } from "@/core/shared/navigation";
import { IngredientForm } from "@/features/nutrition/ingredients/IngredientForm";
import { createIngredientAction } from "../actions";
import { fetchOff, isBarcode } from "@/app/_server/openfoodfacts";
import { BarcodeBox } from "@/features/nutrition/ingredients/BarcodeBox";

type Props = { searchParams: Promise<{ from?: string; barcode?: string }> };

export default async function NewIngredientPage({ searchParams }: Props) {
  const { owner, settings, t } = await requireContext();
  const params = await searchParams;
  const from = safeFrom(params.from, "/ingredients");
  const code = params.barcode && isBarcode(params.barcode) ? params.barcode : null;
  const [knownTags, off] = await Promise.all([
    listTags(getDb(), owner),
    code ? fetchOff(code) : null,
  ]);
  // The form's values as text; the barcode itself is kept in the notes.
  const initial: Record<string, string> = off
    ? {
        name: off.name,
        // The package goes in the notes: size alone, without a price, can't be saved.
        description: [
          off.description,
          off.packageSize ? `${off.packageSize} ${off.unit}` : "",
          `EAN ${off.barcode}`,
        ]
          .filter(Boolean)
          .join(" · "),
        unit: off.unit,
        kcal: off.kcal,
        protein: off.protein,
        carbs: off.carbs,
        sugars: off.sugars,
        fat: off.fat,
        saturatedFat: off.saturatedFat,
        fiber: off.fiber,
        salt: off.salt,
        nova: off.nova,
      }
    : { unit: "g" };
  return (
    // Forms read best narrow: cap the width even on wide screens.
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <IngredientForm
        // A looked-up code starts the form again from its values.
        key={code ?? "new"}
        intro={<BarcodeBox code={code} found={Boolean(off)} t={t.barcode} />}
        title={t.ingredients.newTitle}
        from={from}
        action={createIngredientAction}
        initial={initial}
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
