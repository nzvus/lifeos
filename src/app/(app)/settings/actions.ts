/**
 * app/(app)/settings/actions.ts — saves time zone and language (database),
 * and the per-device display settings (cookies, ADR-0010).
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { saveDisplay } from "@/app/_server/display";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { savePreferences, saveSettings } from "@/core/nutrition/repositories/settings";
import { parseInput, preferencesInput, settingsInput } from "@/core/nutrition/validation";
import { parseColorMode, parseLayout } from "@/core/shared/display";
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

export async function saveDisplayAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireContext(); // signed-in only, like every action
  const value = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" ? v : undefined;
  };
  // Unknown values fall back to the defaults: nothing to report as an error.
  await saveDisplay({
    mode: parseColorMode(value("mode")),
    layout: parseLayout(value("layout")),
  });
  // The attributes live on <html>, in the root layout.
  revalidatePath("/", "layout");
  return { status: "saved" };
}

/** Preferences (migration 0006): auto targets, moment hours, default views. */
export async function savePreferencesAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(preferencesInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  await savePreferences(getDb(), owner, input.value);
  // Targets, moments and default views show on every page.
  revalidatePath("/", "layout");
  return { status: "saved" };
}
