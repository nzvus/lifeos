/** app/(app)/settings/actions.ts — saves time zone, language and targets. */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { saveSettings } from "@/core/nutrition/repositories/settings";
import { parseInput, settingsInput } from "@/core/nutrition/validation";
import type { FormState } from "@/core/shared/result";

export async function saveSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(settingsInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  await saveSettings(getDb(), owner, input.value);
  // "layout": language and time zone affect every page, not just this one.
  revalidatePath("/", "layout");
  return { status: "saved" };
}
