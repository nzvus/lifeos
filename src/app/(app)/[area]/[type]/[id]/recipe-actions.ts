"use server";
/**
 * A saved meal made or changed in the composer (ledger FOOD-42): the same
 * lines and estimate checks as a meal of the day (`formLines`, the catalog
 * read again here), its name new among the person's saved meals, and no
 * day entry written. «Parti da…» keeps the meal it started from
 * (`based_on`, FOOD-33: no «Duplica»).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { ownerClock } from "@/app/_server/clock";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
import {
  createEstimateRecipe,
  createRecipe,
  createVariant,
  recipeName,
  recipeNameTaken,
  replaceRecipe,
} from "@/core/food/recipes";
import type { MealState } from "@/features/food/Composer";
import { parseLines, RECIPE_WORDS } from "@/features/food/composer";
import { formLines } from "../../../aggiungi/pasto/meal-input";

const NO_FOOD = "Aggiungi almeno un cibo, o scrivi una stima.";

async function read(prev: MealState, data: FormData) {
  const owner = await requireOwner();
  const db = await getDb();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const lines = parseLines(form["lines"] ?? "");
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const choices = await readFoodChoices(db, owner, today);
  const checked = formLines(form, lines, choices);
  const name = recipeName(form["recipeName"] ?? "");
  const errors: Record<string, string> = checked.ok ? {} : { ...checked.errors };
  if (!name.ok) errors["recipeName"] = RECIPE_WORDS[name.error];
  if (checked.ok && !checked.estimate && !checked.lines.some((l) => l.itemId))
    errors["lines"] = NO_FOOD;
  const again = (more: Record<string, string> = {}): MealState => ({
    errors: { ...errors, ...more },
    values: form,
    lines,
    n: prev.n + 1,
  });
  return { owner, db, form, today, choices, checked, name, errors, again };
}

/** «+ Nuovo pasto» or «Parti da…» (`basedOn`): a new saved meal, then its page. */
export async function createSaved(
  basedOn: string | null,
  prev: MealState,
  data: FormData,
): Promise<MealState> {
  const r = await read(prev, data);
  if (!r.checked.ok || !r.name.ok || Object.keys(r.errors).length > 0) return r.again();
  if (await recipeNameTaken(r.db, r.owner, r.name.name))
    return r.again({ recipeName: RECIPE_WORDS.taken });
  // «Parti da…» only from a live saved meal of the person's own.
  const recipes = await readRecipeChoices(r.db, r.owner, r.today, r.choices);
  const base = recipes.some((x) => x.recipeId === basedOn) ? basedOn : null;
  const id = r.checked.estimate
    ? await createEstimateRecipe(r.db, r.owner, r.name.name, r.checked.lines[0]!.per100)
    : await createRecipe(r.db, r.owner, r.name.name, r.checked.lines, base);
  revalidatePath("/", "layout");
  redirect("/cibo/pasto/" + id);
}

/** «Modifica» on a saved meal: its name and foods (or totals) written again. */
export async function replaceSaved(
  id: string,
  prev: MealState,
  data: FormData,
): Promise<MealState> {
  const r = await read(prev, data);
  if (!r.checked.ok || !r.name.ok || Object.keys(r.errors).length > 0) return r.again();
  const done = await replaceRecipe(r.db, r.owner, id, r.name.name, r.checked);
  if (done === "taken") return r.again({ recipeName: RECIPE_WORDS.taken });
  if (done === "gone") return r.again({ form: "Questo pasto non c’è più." });
  if (done === "empty") return r.again({ lines: NO_FOOD });
  revalidatePath("/", "layout");
  redirect("/cibo/pasto/" + id);
}

/** «+ Variante» of `baseId` (ADR-0060): stores only what differs from the base. */
export async function createVariantSaved(
  baseId: string,
  prev: MealState,
  data: FormData,
): Promise<MealState> {
  const r = await read(prev, data);
  if (!r.checked.ok || !r.name.ok || Object.keys(r.errors).length > 0) return r.again();
  if (r.checked.estimate)
    return r.again({ form: "Una variante è fatta di cibi: togli la stima." });
  const made = await createVariant(r.db, r.owner, baseId, r.name.name, r.checked.lines);
  if (made === "taken") return r.again({ recipeName: RECIPE_WORDS.taken });
  if (made === "gone") return r.again({ form: "Il pasto di base non c’è più." });
  revalidatePath("/", "layout");
  redirect("/cibo/pasto/" + made.id);
}
