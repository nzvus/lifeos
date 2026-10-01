/**
 * app/(app)/meals/actions.ts — server actions for meals.
 * The meal form sends its lines as JSON in one hidden field `items`
 * (features/nutrition/meals/MealForm.tsx); parseJsonField turns it back into
 * an array before core validates it line by line.
 *
 * ADR-0015: saving returns "saved" and the form goes back to where it came
 * from (with "Saved · Undo"); deleting moves the meal to the trash and
 * returns, so the page can offer "Undo" (restoreMealAction).
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  createMeal,
  deleteMeal,
  restoreMeal,
  updateMeal,
} from "@/core/nutrition/repositories/meals";
import { mealFormData, mealInput, parseInput } from "@/core/nutrition/validation";
import type { FormState } from "@/core/shared/result";

function readMealForm(formData: FormData) {
  const values = formToObject(formData);
  const data = mealFormData(values);
  return { values, input: parseInput(mealInput, data) };
}

export async function createMealAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const { values, input } = readMealForm(formData);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const result = await createMeal(getDb(), owner, input.value);
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/meals");
  return { status: "saved" };
}

export async function updateMealAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const { values, input } = readMealForm(formData);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const result = await updateMeal(getDb(), owner, id, input.value);
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/meals");
  return { status: "saved" };
}

/** Moves a meal to the trash; the message is translated for the toast. */
export async function deleteMealAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await deleteMeal(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Takes a meal out of the trash (the toast's "Undo"). */
export async function restoreMealAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await restoreMeal(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}
