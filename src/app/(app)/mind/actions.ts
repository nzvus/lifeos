/**
 * app/(app)/mind/actions.ts — the day's check-in (ADR-0038), saved by the
 * form itself on every tap.
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { saveCheckin } from "@/core/mind/repositories/checkins";
import { checkinInput } from "@/core/mind/validation";
import type { FormState } from "@/core/shared/result";
import { parseInput } from "@/core/shared/validation";

export async function saveCheckinAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(checkinInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  await saveCheckin(getDb(), owner, input.value);
  revalidatePath("/", "layout");
  return { status: "saved" };
}
