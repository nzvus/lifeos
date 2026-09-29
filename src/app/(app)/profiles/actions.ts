/**
 * app/(app)/profiles/actions.ts — server actions for day types (ADR-0008).
 * Same four steps as every action: who? valid? do it, refresh.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  createProfile,
  deleteProfile,
  setDefaultProfile,
  updateProfile,
} from "@/core/nutrition/repositories/profiles";
import { parseInput, profileInput } from "@/core/nutrition/validation";
import type { FormState } from "@/core/shared/result";
import type { ActionButtonState } from "@/ui/ActionButtonForm";

export async function createProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(profileInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const result = await createProfile(getDb(), owner, input.value);
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/", "layout"); // the day page shows the default's targets
  redirect("/profiles");
}

export async function updateProfileAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(profileInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const result = await updateProfile(getDb(), owner, id, input.value);
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/", "layout");
  redirect("/profiles");
}

export async function makeDefaultProfileAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const result = await setDefaultProfile(getDb(), owner, id);
  if (!result.ok)
    return { status: "error", message: t.errors[result.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  redirect("/profiles");
}

export async function deleteProfileAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const result = await deleteProfile(getDb(), owner, id);
  // "is_default": the default can't be deleted before another becomes default.
  if (!result.ok)
    return { status: "error", message: t.errors[result.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  redirect("/profiles");
}
