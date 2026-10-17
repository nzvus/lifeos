/**
 * A composer's form as the meal entry's input, and its extras: saved and
 * edited alike. Servings are kept only when not 1, and must be more than
 * none (the kind allows 0). «Salva anche come pasto» needs a new name; it
 * is checked here, before anything is written.
 */
import type { Db } from "@/core/db/db";
import type { EntryInput } from "@/core/entries";
import type { IsoDate } from "@/core/engines/time";
import { recipeName, recipeNameTaken } from "@/core/food/recipes";
import type { Owner } from "@/core/identity/owner";
import { clockToDayMin } from "@/features/day/entry-form";
import { quantityOf, RECIPE_WORDS } from "@/features/food/composer";

export function mealInput(
  day: IsoDate,
  form: Record<string, string>,
  boundaryMin: number,
): EntryInput {
  const servings = quantityOf(form["servings"] ?? "");
  return {
    day,
    status: form["status"] === "planned" ? "planned" : "done",
    startMin: clockToDayMin(form["start"] ?? "", boundaryMin),
    endMin: null,
    values: {
      role: form["role"] ?? "",
      servings: servings === null || Number(servings) === 1 ? "" : servings,
    },
    note: form["note"] ?? "",
  };
}

/** The extras' errors (servings, the recipe's name) and the name to save, if asked. */
export async function mealExtras(
  db: Db,
  owner: Owner,
  form: Record<string, string>,
): Promise<{ errors: Record<string, string>; saveAs: string | null }> {
  const errors: Record<string, string> = {};
  const raw = (form["servings"] ?? "").trim();
  if (raw !== "" && quantityOf(raw) === null)
    errors["servings"] = "Scrivi le porzioni, per esempio 1 o 1,5.";
  if (form["saveAs"] !== "yes") return { errors, saveAs: null };
  const name = recipeName(form["recipeName"] ?? "");
  if (!name.ok) errors["recipeName"] = RECIPE_WORDS[name.error];
  else if (await recipeNameTaken(db, owner, name.name))
    errors["recipeName"] = RECIPE_WORDS.taken;
  return { errors, saveAs: name.ok ? name.name : null };
}
