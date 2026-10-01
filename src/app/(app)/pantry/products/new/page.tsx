/** app/(app)/pantry/products/new/page.tsx — URL /pantry/products/new[?from=PATH]. */
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listIngredients } from "@/core/nutrition/repositories/ingredients";
import { safeFrom } from "@/core/shared/navigation";
import { ProductForm } from "@/features/nutrition/pantry/ProductForm";
import { PageHeader } from "@/ui/PageHeader";
import { createProductAction } from "../../actions";

type Props = { searchParams: Promise<{ from?: string }> };

export default async function NewProductPage({ searchParams }: Props) {
  const { owner, t } = await requireContext();
  const from = safeFrom((await searchParams).from, "/pantry");
  const ingredients = await listIngredients(getDb(), owner);
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8">
      <PageHeader
        title={t.pantry.newProduct}
        back={{ href: from, label: from === "/pantry" ? t.pantry.back : t.actions.back }}
      />
      <ProductForm
        from={from}
        action={createProductAction}
        initial={{ unit: "g" }}
        ingredients={ingredients.map(({ id, name, unit }) => ({ id, name, unit }))}
        t={{ pantry: t.pantry, errors: t.errors, actions: t.actions }}
      />
    </div>
  );
}
