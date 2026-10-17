"use server";
/**
 * Saving a meal from the composer (V-04): the session's owner; the lines
 * the browser sent, each only a choice's key and a quantity, checked
 * against the catalog read again here (the snapshot comes from the server,
 * ADR-0007); the meal's role, time and status checked as any entry's.
 * On an error the composer gets the words and what was typed; on success
 * the day it was for.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { checkEntry, createEntry } from "@/core/entries";
import { readFoodChoices } from "@/core/food/catalog";
import { checkMealLines } from "@/core/food/meal";
import { kindRegistry } from "@/core/kinds";
import { errorWords } from "@/features/day/entry-form";
import type { MealState } from "@/features/food/Composer";
import { mealErrors, parseLines } from "@/features/food/composer";
import { addContext } from "../kinds";
import { mealInput } from "./meal-input";

export async function saveMeal(prev: MealState, data: FormData): Promise<MealState> {
  const owner = await requireOwner();
  const db = await getDb();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const lines = parseLines(form["lines"] ?? "");
  const ctx = await addContext(db, owner, form["day"]);
  const choices = await readFoodChoices(db, owner, ctx.today);
  const checkedLines = checkMealLines(lines, new Map(choices.map((c) => [c.key, c])));
  const entry = checkEntry(
    kindRegistry().get("meal"),
    mealInput(ctx.day, form, ctx.clock.boundaryMin),
    ctx.clock,
  );
  if (!checkedLines.ok || !entry.ok) {
    const errors = mealErrors(
      entry.ok ? null : entry.errors,
      checkedLines.ok ? null : checkedLines,
      errorWords,
    );
    return { errors, values: form, lines, n: prev.n + 1 };
  }
  await createEntry(db, owner, { ...entry.entry, lines: checkedLines.lines });
  revalidatePath("/oggi", "layout");
  redirect(ctx.day === ctx.today ? "/oggi" : "/oggi/" + ctx.day);
}
