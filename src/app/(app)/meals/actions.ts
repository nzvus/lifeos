/**
 * app/(app)/meals/actions.ts — server actions for meals.
 * The meal form sends its lines as JSON in one hidden field `items`
 * (features/nutrition/meals/MealForm.tsx); parseJsonField turns it back into
 * an array before core validates it line by line.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formToObject, parseJsonField } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { createMeal, deleteMeal, updateMeal } from "@/core/nutrition/repositories/meals";
import { mealInput, parseInput } from "@/core/nutrition/validation";
import type { FormState } from "@/core/shared/result";
import type { ActionButtonState } from "@/ui/ActionButtonForm";

function readMealForm(formData: FormData) {
  const values = formToObject(formData);
  const data = {
    name: values.name,
    notes: values.notes,
    items: parseJsonField(values.items),
  };
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
  redirect("/meals");
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
  redirect("/meals");
}

export async function deleteMealAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const result = await deleteMeal(getDb(), owner, id);
  if (!result.ok)
    return { status: "error", message: t.errors[result.errors._form ?? "not_found"] };
  revalidatePath("/meals");
  redirect("/meals");
}
