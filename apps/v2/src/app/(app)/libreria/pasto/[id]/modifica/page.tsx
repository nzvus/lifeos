/** A saved meal's editor (V-07): `/libreria/pasto/<id>/modifica`. */
import { notFound } from "next/navigation";
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readRecipe } from "@/core/food/recipes";
import { RecipeForm } from "@/features/library/RecipeForm";
import { archiveSaved, saveRecipe } from "./actions";

export default async function SavedMealEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwner();
  const { id } = await params;
  const r = await readRecipe(await getDb(), owner, id);
  if (!r) notFound();
  return (
    <RecipeForm
      name={r.name}
      parts={r.parts.map((p) => ({
        position: p.position,
        name: p.name,
        quantity: p.quantity === null ? "" : F.n(Number(p.quantity), 2),
        unit: p.unit ?? "g",
      }))}
      backHref={"/libreria/pasto/" + id}
      action={saveRecipe.bind(null, id)}
      archive={archiveSaved.bind(null, id)}
    />
  );
}
