/**
 * app/(app)/training/programs/actions.ts — training programs (ADR-0024):
 * create, update, trash and restore. Slots arrive as one JSON field.
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import type { FormState } from "@/core/shared/result";
import { parseInput } from "@/core/shared/validation";
import {
  createProgram,
  deleteProgram,
  restoreProgram,
  updateProgram,
} from "@/core/training/repositories/programs";
import { programInput } from "@/core/training/validation";

const read = (formData: FormData) => {
  const values = formToObject(formData);
  return { values, input: parseInput(programInput, values) };
};

export async function createProgramAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const { values, input } = read(formData);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await createProgram(getDb(), owner, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function updateProgramAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const { values, input } = read(formData);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await updateProgram(getDb(), owner, id, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function deleteProgramAction(id: string) {
  const { owner, t } = await requireContext();
  const r = await deleteProgram(getDb(), owner, id);
  revalidatePath("/", "layout");
  return r.ok ? { ok: true } : { ok: false, message: t.errors.not_found };
}

export async function restoreProgramAction(id: string) {
  const { owner, t } = await requireContext();
  const r = await restoreProgram(getDb(), owner, id);
  revalidatePath("/", "layout");
  return r.ok ? { ok: true } : { ok: false, message: t.errors.not_found };
}
