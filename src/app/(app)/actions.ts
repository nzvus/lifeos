/**
 * app/(app)/actions.ts — server actions of the day view (URL /).
 *
 * "use server" marks every exported function as a SERVER ACTION: the browser
 * gets a reference, not the code; calling it sends a POST request that runs
 * the function here, on the server. Forms in features/ receive these as props.
 *
 * Why actions live in app/ rather than in features/ (ARCHITECTURE.md): an
 * action must read the session cookie, and ADR-0006 allows that only in app/.
 * Every action has the same four steps and nothing more:
 *   1. who?      requireContext() -> Owner (or redirect to sign-in)
 *   2. valid?    core validation   -> error codes + submitted values back
 *   3. do it     core repository   -> Result
 *   4. refresh   revalidatePath    -> the page re-renders with fresh data
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  deleteLogEntry,
  logIngredient,
  logMeal,
} from "@/core/nutrition/repositories/log";
import {
  logIngredientInput,
  logMealInput,
  parseInput,
} from "@/core/nutrition/validation";
import type { FormState } from "@/core/shared/result";
import type { ActionButtonState } from "@/ui/ActionButtonForm";

export async function logMealAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(logMealInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const result = await logMeal(getDb(), owner, input.value);
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/");
  return { status: "saved" };
}

export async function logIngredientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(logIngredientInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const result = await logIngredient(getDb(), owner, input.value);
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/");
  return { status: "saved" };
}

/**
 * Bound per entry: the page passes `deleteLogEntryAction.bind(null, id)`.
 * The id comes from our own render, but a request can be forged, so it is
 * still only used through the owner-checked repository.
 */
export async function deleteLogEntryAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const result = await deleteLogEntry(getDb(), owner, id);
  if (!result.ok)
    return { status: "error", message: t.errors[result.errors._form ?? "not_found"] };
  revalidatePath("/");
  return { status: "idle" };
}
