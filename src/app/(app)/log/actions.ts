/**
 * app/(app)/log/actions.ts — saving a day's entry edited as a local copy
 * (ADR-0022). The lines arrive as one JSON field, like the meal editor's.
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { editLogEntry } from "@/core/nutrition/repositories/log";
import { entryLinesInput } from "@/core/nutrition/validation";
import type { FormState } from "@/core/shared/result";
import { parseInput } from "@/core/shared/validation";

export async function editEntryAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  let items: unknown;
  try {
    items = JSON.parse(values.items ?? "[]");
  } catch {
    items = undefined;
  }
  const input = parseInput(entryLinesInput, { servings: values.servings, items });
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await editLogEntry(getDb(), owner, id, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/");
  return { status: "saved" };
}
