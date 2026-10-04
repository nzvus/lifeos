/**
 * app/(app)/money/actions.ts — server actions of the Money tab (ADR-0036):
 * add, change, trash and restore a movement. Each: requireContext() → core
 * validation → repository → revalidate.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  addMovement,
  deleteMovement,
  restoreMovement,
  updateMovement,
} from "@/core/money/repositories/money";
import { movementInput } from "@/core/money/validation";
import type { FormState } from "@/core/shared/result";
import { parseInput } from "@/core/shared/validation";

export async function addMovementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(movementInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await addMovement(getDb(), owner, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/money", "layout");
  return { status: "saved" };
}

/** Bound per movement by the edit page; back to where it came from. */
export async function updateMovementAction(
  id: string,
  back: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(movementInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await updateMovement(getDb(), owner, id, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/money", "layout");
  redirect(back);
}

export async function deleteMovementAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await deleteMovement(getDb(), owner, id);
  revalidatePath("/money", "layout");
  return r.ok ? { ok: true } : { ok: false, message: t.errors.not_found };
}

export async function restoreMovementAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await restoreMovement(getDb(), owner, id);
  revalidatePath("/money", "layout");
  return r.ok ? { ok: true } : { ok: false, message: t.errors.not_found };
}
