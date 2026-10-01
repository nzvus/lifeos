/**
 * app/(app)/ingredients/actions.ts — server actions for ingredients.
 * Same four steps as app/(app)/actions.ts (who? valid? do it, refresh).
 * ADR-0015: saving returns "saved" (the form goes back to where it came
 * from, with Undo); deleting moves the ingredient to the trash and returns,
 * so the page can offer Undo (restoreIngredientAction).
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  createIngredient,
  deleteIngredient,
  restoreIngredients,
  updateIngredient,
} from "@/core/nutrition/repositories/ingredients";
import { ingredientInput, parseInput } from "@/core/nutrition/validation";
import type { FormState } from "@/core/shared/result";

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
  return { status: "saved" };
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
  return { status: "saved" };
}

/** Moves an ingredient to the trash ("in_use" while a live meal has it). */
export async function deleteIngredientAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await deleteIngredient(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Takes an ingredient out of the trash (the toast's "Undo"). */
export async function restoreIngredientAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await restoreIngredients(getDb(), owner, [id]);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}
