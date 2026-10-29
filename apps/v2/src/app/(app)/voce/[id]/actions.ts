"use server";
/**
 * Editing a logged entry (V-03 and V-04 opened from Oggi's «›»). Each
 * action is bound to the entry's id by the page; the entry is read again
 * here (owned, live), checked as when it was made, and changed: a sheet
 * writes only the fields it shows; a meal's old lines keep the values they
 * were logged with (ADR-0007) and new ones take today's.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { checkEntry, readEntry, updateEntry } from "@/core/entries";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
import { lineChoices } from "@/core/food/choices";
import { ESTIMATE_CONFIDENCE, typedEstimate } from "@/core/food/meal";
import { kindRegistry } from "@/core/kinds";
import type { SaveState } from "@/features/day/EntrySheet";
import { errorWords, managedFields, readEntryForm } from "@/features/day/entry-form";
import type { MealState } from "@/features/food/Composer";
import { mealErrors, parseLines } from "@/features/food/composer";
import { addContext } from "../../aggiungi/kinds";
import {
  formLines,
  mealExtras,
  mealInput,
  recipeOf,
  saveAsRecipe,
} from "../../aggiungi/pasto/meal-input";

const GONE = "Questa voce non c’è più: forse è stata eliminata.";

function formOf(data: FormData): Record<string, string> {
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  return form;
}

function backTo(day: string, today: string): never {
  revalidatePath("/oggi", "layout");
  redirect(day === today ? "/oggi" : "/oggi/" + day);
}

export async function updateSheet(
  id: string,
  prev: SaveState,
  data: FormData,
): Promise<SaveState> {
  const owner = await requireOwner();
  const db = await getDb();
  const form = formOf(data);
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  const item = await readEntry(db, owner, id);
  if (!item) return again({ form: GONE });
  const ctx = await addContext(db, owner, item.day);
  const kind = ctx.kinds.find((k) => k.key === item.kind.key);
  if (!kind) return again({ form: "Questo tipo non si modifica da qui." });
  const checked = checkEntry(
    kind,
    readEntryForm(kind, item.day, form, ctx.clock.boundaryMin),
    ctx.clock,
  );
  if (!checked.ok) return again(errorWords(checked.errors));
  if (!(await updateEntry(db, owner, id, checked.entry, managedFields(kind))))
    return again({ form: GONE });
  backTo(item.day, ctx.today);
}

export async function updateMeal(
  id: string,
  prev: MealState,
  data: FormData,
): Promise<MealState> {
  const owner = await requireOwner();
  const db = await getDb();
  const form = formOf(data);
  const lines = parseLines(form["lines"] ?? "");
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    lines,
    n: prev.n + 1,
  });
  const item = await readEntry(db, owner, id);
  if (!item || item.kind.key !== "meal") return again({ form: GONE });
  const ctx = await addContext(db, owner, item.day);
  const foods = await readFoodChoices(db, owner, ctx.today);
  const choices = [...lineChoices(item.lines), ...foods];
  // The recipe it was of stays allowed even if archived since; else one of the person's own.
  const linked = item.item?.id ?? null;
  const recipe =
    form["recipe"] === linked
      ? linked
      : recipeOf(
          form,
          await readRecipeChoices(db, owner, ctx.today, foods),
          form["estimate"] === "yes",
        );
  const checkedLines = formLines(form, lines, choices);
  const entry = checkEntry(
    kindRegistry().get("meal"),
    mealInput(item.day, form, ctx.clock.boundaryMin, ctx.roleBounds),
    ctx.clock,
  );
  const extras = await mealExtras(db, owner, form);
  if (!checkedLines.ok || !entry.ok || Object.keys(extras.errors).length > 0)
    return again({
      ...mealErrors(entry.ok ? null : entry.errors, null, errorWords),
      ...(checkedLines.ok ? {} : checkedLines.errors),
      ...extras.errors,
    });
  // An estimate composed with foods becomes typed food; a converted one with foods keeps its confidence.
  const wasTyped = typedEstimate(item.values, item.lines) !== null;
  const saved = extras.saveAs
    ? await saveAsRecipe(db, owner, extras.saveAs, checkedLines)
    : null;
  if (
    !(await updateEntry(
      db,
      owner,
      id,
      {
        ...entry.entry,
        lines: checkedLines.lines,
        itemId: saved ?? recipe,
        ...(checkedLines.estimate
          ? { confidence: ESTIMATE_CONFIDENCE }
          : wasTyped
            ? { confidence: "1" }
            : {}),
      },
      checkedLines.estimate || wasTyped
        ? ["role", "servings", "estimated"]
        : ["role", "servings"],
    ))
  )
    return again({ form: GONE });
  backTo(item.day, ctx.today);
}
