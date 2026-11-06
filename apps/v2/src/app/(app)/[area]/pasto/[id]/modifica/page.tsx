/** A saved meal changed in the composer (FOOD-42): `/cibo/pasto/<id>/modifica`. */
import { notFound } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readRecipe } from "@/core/food/recipes";
import { replaceSaved } from "../../saved-actions";
import { SavedComposer } from "../../saved-composer";

export default async function SavedMealEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // A saved estimate has no parts but is a live recipe too: readRecipe answers both.
  const owner = await requireOwner();
  if (!(await readRecipe(await getDb(), owner, id))) notFound();
  return (
    <SavedComposer
      from={id}
      editing
      backHref={"/cibo/pasto/" + id}
      action={replaceSaved.bind(null, id)}
    />
  );
}
