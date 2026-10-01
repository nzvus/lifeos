/**
 * app/(app)/profiles/actions.ts — server actions for day types (ADR-0008).
 * Same four steps as every action: who? valid? do it, refresh.
 * ADR-0015: saving returns "saved" (the form goes back to its origin with
 * Undo); deleting moves to the trash (restoreProfileAction undoes it).
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  createProfile,
  deleteProfile,
  restoreProfile,
  setDefaultProfile,
  updateProfile,
} from "@/core/nutrition/repositories/profiles";
import { parseInput, profileInput } from "@/core/nutrition/validation";
import type { FormState } from "@/core/shared/result";

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
  return { status: "saved" };
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
  return { status: "saved" };
}

/** Makes this day type the default (the page's "⋯" menu). */
export async function makeDefaultProfileAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await setDefaultProfile(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Moves a day type to the trash; the default one: "is_default". */
export async function deleteProfileAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await deleteProfile(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Takes a day type out of the trash (the toast's "Undo"). */
export async function restoreProfileAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await restoreProfile(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}
