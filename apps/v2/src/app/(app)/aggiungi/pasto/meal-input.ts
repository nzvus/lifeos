/**
 * A composer's form as the meal entry's input, and its extras: saved and
 * edited alike. Servings are kept only when not 1, and must be more than
 * none (the kind allows 0). «Salva anche come pasto» needs a new name; it
 * is checked here, before anything is written. An estimate has no servings,
 * and is saved as a saved estimate (its totals, no foods). The role is
 * always stored (capture.md §4): the one chosen («manual»), else the one of
 * the meal's time from the person's bounds («auto», taken again from the
 * time on every save, so moving the meal moves its role).
 */
import type { Db } from "@/core/db/db";
import type { EntryInput } from "@/core/entries";
import type { IsoDate } from "@/core/engines/time";
import type { CheckedLine } from "@/core/entries";
import type { FoodChoice } from "@/core/food/choices";
import {
  checkEstimate,
  checkMealLines,
  ESTIMATE_FIELDS,
  type LineInput,
} from "@/core/food/meal";
import type { RecipeChoice } from "@/core/food/choices";
import {
  createEstimateRecipe,
  createRecipe,
  recipeName,
  recipeNameTaken,
} from "@/core/food/recipes";
import type { Owner } from "@/core/identity/owner";
import { mealRoleAt, type RoleBounds } from "@/core/kinds";
import { clockToDayMin, errorWords } from "@/features/day/entry-form";
import {
  ESTIMATE_WORDS,
  mealErrors,
  quantityOf,
  RECIPE_WORDS,
} from "@/features/food/composer";

export function mealInput(
  day: IsoDate,
  form: Record<string, string>,
  boundaryMin: number,
  bounds: RoleBounds,
): EntryInput {
  const estimate = form["estimate"] === "yes";
  // An estimate's totals are the whole meal: no servings.
  const servings = estimate ? null : quantityOf(form["servings"] ?? "");
  return {
    day,
    status: form["status"] === "planned" ? "planned" : "done",
    startMin: clockToDayMin(form["start"] ?? "", boundaryMin),
    endMin: null,
    values: {
      // An «assunzione» has no role (capture.md §4).
      ...(form["kind"] === "intake"
        ? {}
        : roleOf(form["role"] ?? "", form["start"] ?? "", bounds)),
      servings: servings === null || Number(servings) === 1 ? "" : servings,
      estimated: estimate ? "true" : "",
    },
    note: form["note"] ?? "",
  };
}

/** The role chosen, else the time's; with no time, none (Oggi lists it untimed). */
export function roleOf(
  chosen: string,
  start: string,
  bounds: RoleBounds,
): { role: string; roleSource: string } {
  if (chosen) return { role: chosen, roleSource: "manual" };
  const m = /^(\d{1,2}):(\d{2})$/.exec(start.trim());
  if (!m) return { role: "", roleSource: "" };
  return {
    role: mealRoleAt(Number(m[1]) * 60 + Number(m[2]), bounds),
    roleSource: "auto",
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
  if (form["estimate"] !== "yes" && raw !== "" && quantityOf(raw) === null)
    errors["servings"] = "Scrivi le porzioni, per esempio 1 o 1,5.";
  if (form["saveAs"] !== "yes") return { errors, saveAs: null };
  const name = recipeName(form["recipeName"] ?? "");
  if (!name.ok) errors["recipeName"] = RECIPE_WORDS[name.error];
  else if (await recipeNameTaken(db, owner, name.name))
    errors["recipeName"] = RECIPE_WORDS.taken;
  return { errors, saveAs: name.ok ? name.name : null };
}

/** The saved meal it is of: the person's own, and an estimate only of a saved estimate. */
export function recipeOf(
  form: Record<string, string>,
  recipes: readonly RecipeChoice[],
  estimate: boolean,
): string | null {
  const r = recipes.find((x) => x.recipeId === form["recipe"]);
  return r && (r.estimate !== undefined) === estimate ? r.recipeId : null;
}

/** «Salva anche come pasto»: the foods as a recipe, an estimate's one line as a saved estimate. */
export function saveAsRecipe(
  db: Db,
  owner: Owner,
  name: string,
  checked: { lines: CheckedLine[]; estimate: boolean },
): Promise<string> {
  return checked.estimate
    ? createEstimateRecipe(db, owner, name, checked.lines[0]!.per100)
    : createRecipe(db, owner, name, checked.lines);
}

/**
 * The meal's lines from the form: the foods composed, or in «Stima a mano»
 * the typed totals as one line, its confidence 0.60 and marked estimated.
 */
export function formLines(
  form: Record<string, string>,
  lines: readonly LineInput[],
  choices: readonly FoodChoice[],
):
  | { ok: true; lines: CheckedLine[]; estimate: boolean }
  | { ok: false; errors: Record<string, string> } {
  if (form["estimate"] === "yes") {
    const typed = Object.fromEntries(
      ESTIMATE_FIELDS.map((f) => [f, form["est." + f] ?? ""]),
    );
    const c = checkEstimate(typed, form["estName"] ?? "");
    if (c.ok) return { ok: true, lines: [c.line], estimate: true };
    const errors: Record<string, string> = {};
    for (const [f, code] of Object.entries(c.at))
      errors["est." + f] = ESTIMATE_WORDS[code];
    return { ok: false, errors };
  }
  const c = checkMealLines(lines, new Map(choices.map((x) => [x.key, x])));
  return c.ok
    ? { ok: true, lines: c.lines, estimate: false }
    : { ok: false, errors: mealErrors(null, c, errorWords) };
}
