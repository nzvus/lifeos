"use server";
/** Saving a food's editor (V-07): the session's owner, the form checked by core, then written. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { SNAPSHOT_FIELDS } from "@/core/food/choices";
import { checkFood, createFood, updateFood, type FoodValueError } from "@/core/food/edit";
import { archiveItem } from "@/core/catalog/archive";
import { RECIPE_WORDS } from "@/features/food/composer";
import type { FoodFormState } from "@/features/library/FoodForm";

const WORDS: Record<FoodValueError, string> = {
  number: "Scrivi un numero, per esempio 13 o 13,5.",
  too_much: "È troppo per 100 g: controlla il numero.",
  nova: "NOVA va da 1 a 4.",
};

/** Saves the food's form; `id` null creates a new one («Nuovo cibo»). */
export async function saveFood(
  id: string | null,
  /** Where a new food goes once made (the composer), checked by the page. */
  back: string | null,
  prev: FoodFormState,
  data: FormData,
): Promise<FoodFormState> {
  const owner = await requireOwner();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  const checked = checkFood(
    form["name"] ?? "",
    Object.fromEntries(SNAPSHOT_FIELDS.map((f) => [f, form[f] ?? ""])),
  );
  if (!checked.ok) {
    const errors: Record<string, string> = {};
    if (checked.name)
      errors["name"] = RECIPE_WORDS[checked.name].replace("pasto", "cibo");
    for (const [f, code] of Object.entries(checked.at)) errors[f] = WORDS[code];
    return again(errors);
  }
  const db = await getDb();
  if (id === null) {
    const made = await createFood(
      db,
      owner,
      checked.name,
      form["unit"] === "ml" ? "ml" : "g",
      checked.values,
    );
    if (made === "taken") return again({ name: "Hai già un cibo con questo nome." });
    revalidatePath("/libreria", "layout");
    redirect(back ?? "/libreria/cibo/" + made.id);
  }
  const done = await updateFood(db, owner, id, checked.name, checked.values);
  if (done === "gone") return again({ form: "Questo cibo non c’è più." });
  if (done === "taken") return again({ name: "Hai già un cibo con questo nome." });
  revalidatePath("/libreria", "layout");
  redirect("/libreria/cibo/" + id);
}

/** Archives the food (and so its products): out of Libreria and the composer. */
export async function archiveFood(id: string): Promise<void> {
  await archiveItem(await getDb(), await requireOwner(), id, "food");
  revalidatePath("/libreria", "layout");
  redirect("/libreria");
}
