"use server";
/** Saving or archiving a saved meal from its editor (V-07). */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  archiveRecipe,
  duplicateRecipe,
  recipeName,
  updateRecipe,
} from "@/core/food/recipes";
import { quantityOf, RECIPE_WORDS } from "@/features/food/composer";
import type { RecipeFormState } from "@/features/library/RecipeForm";

export async function saveRecipe(
  id: string,
  prev: RecipeFormState,
  data: FormData,
): Promise<RecipeFormState> {
  const owner = await requireOwner();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  const errors: Record<string, string> = {};
  const name = recipeName(form["name"] ?? "");
  if (!name.ok) errors["name"] = RECIPE_WORDS[name.error];
  const keep = (form["kept"] ?? "")
    .split(",")
    .filter((x) => /^\d+$/.test(x))
    .map((x) => {
      const q = quantityOf(form["q." + x] ?? "");
      if (q === null || Number(q) > 5000 || !/^\d+(\.\d{1,2})?$/.test(q))
        errors["q." + x] = "Scrivi una quantità, per esempio 60 o 60,5.";
      return { position: Number(x), quantity: q ?? "" };
    });
  if (keep.length === 0) errors["form"] = "Lascia almeno un cibo, o archivia il pasto.";
  if (!name.ok || Object.keys(errors).length > 0) return again(errors);
  const done = await updateRecipe(await getDb(), owner, id, name.name, keep);
  if (done === "taken") return again({ name: RECIPE_WORDS.taken });
  if (done === "gone") return again({ form: "Questo pasto non c’è più." });
  if (done === "empty")
    return again({ form: "Lascia almeno un cibo, o archivia il pasto." });
  revalidatePath("/libreria", "layout");
  redirect("/libreria/pasto/" + id);
}

export async function archiveSaved(id: string): Promise<void> {
  const owner = await requireOwner();
  await archiveRecipe(await getDb(), owner, id);
  revalidatePath("/libreria", "layout");
  redirect("/libreria?vista=pasti");
}

/** «Duplica»: a copy to change, opened in its editor. */
export async function duplicateSaved(id: string): Promise<void> {
  const copy = await duplicateRecipe(await getDb(), await requireOwner(), id);
  revalidatePath("/libreria", "layout");
  redirect(copy ? "/libreria/pasto/" + copy + "/modifica" : "/libreria?vista=pasti");
}
