/** app/(app)/training/actions.ts — create, update and delete sessions (ADR-0005). */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { parseInput } from "@/core/shared/validation";
import type { FormState } from "@/core/shared/result";
import {
  createSession,
  deleteSession,
  updateSession,
} from "@/core/training/repositories/sessions";
import { sessionInput } from "@/core/training/validation";
import type { ActionButtonState } from "@/ui/ActionButtonForm";

export async function createSessionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(sessionInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await createSession(getDb(), owner, input.value, settings.timezone);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout"); // the day page shows sessions too
  redirect(`/training/${r.value.id}`);
}

export async function updateSessionAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(sessionInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await updateSession(getDb(), owner, id, input.value, settings.timezone);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function deleteSessionAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const r = await deleteSession(getDb(), owner, id);
  if (!r.ok) return { status: "error", message: t.errors.not_found };
  revalidatePath("/", "layout");
  redirect("/training");
}
