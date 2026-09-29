/**
 * app/(app)/ingredients/actions.ts — server actions for ingredients.
 * Same four steps as app/(app)/actions.ts (who? valid? do it, refresh).
 * On success they redirect() to the list; redirect works by throwing a
 * special signal, so it is never called inside a try/catch.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  createIngredient,
  deleteIngredient,
  updateIngredient,
} from "@/core/nutrition/repositories/ingredients";
import { ingredientInput, parseInput } from "@/core/nutrition/validation";
import type { FormState } from "@/core/shared/result";
import type { ActionButtonState } from "@/ui/ActionButtonForm";

export async function createIngredientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(ingredientInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const result = await createIngredient(getDb(), owner, input.value);
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/ingredients");
  redirect("/ingredients");
}

/** Bound per ingredient: `updateIngredientAction.bind(null, id)`. */
export async function updateIngredientAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(ingredientInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const result = await updateIngredient(getDb(), owner, id, input.value);
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/ingredients");
  revalidatePath("/meals"); // meal totals use current ingredient values
  redirect("/ingredients");
}

export async function deleteIngredientAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const result = await deleteIngredient(getDb(), owner, id);
  // "in_use" is the interesting case: a meal still contains this ingredient.
  if (!result.ok)
    return { status: "error", message: t.errors[result.errors._form ?? "not_found"] };
  revalidatePath("/ingredients");
  redirect("/ingredients");
}
