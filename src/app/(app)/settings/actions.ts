/**
 * app/(app)/settings/actions.ts — saves time zone and language (database),
 * the per-device display settings (cookies, ADR-0010), body data and the
 * goal (ADR-0014, ADR-0043).
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { saveDisplay } from "@/app/_server/display";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { savePreferences, saveSettings } from "@/core/nutrition/repositories/settings";
import {
  factorInput,
  parseInput,
  preferencesInput,
  settingsInput,
} from "@/core/nutrition/validation";
import { createFactor, deleteFactor } from "@/core/nutrition/repositories/ratings";
import type { ActionButtonState } from "@/ui/ActionButtonForm";
import { parseColorMode, parseDensity, parseLayout } from "@/core/shared/display";
import { saveBody } from "@/core/energy/repositories/energy";
import { setGoal } from "@/core/energy/repositories/goals";
import { bodyInput, goalInput } from "@/core/energy/validation";
import { todayIn } from "@/core/shared/dates";
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
    density: parseDensity(value("density")),
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

/** A new rating factor (ADR-0012). */
export async function createFactorAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(factorInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await createFactor(getDb(), owner, input.value.name);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout"); // the meal editors and lists show factors
  return { status: "saved" };
}

/** Deletes a factor and its scores. Bound per factor. */
export async function deleteFactorAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const r = await deleteFactor(getDb(), owner, id);
  if (!r.ok) return { status: "error", message: t.errors.not_found };
  revalidatePath("/", "layout");
  return { status: "idle" };
}

/** Body data for the energy model (ADR-0014). */
export async function saveBodyAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(bodyInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  await saveBody(getDb(), owner, input.value);
  revalidatePath("/", "layout"); // the day's energy and dynamic targets
  return { status: "saved" };
}

/** The goal from today on (ADR-0043): past days keep theirs. */
export async function saveGoalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(goalInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  await setGoal(getDb(), owner, todayIn(settings.timezone), input.value);
  revalidatePath("/", "layout"); // dynamic days' targets
  return { status: "saved" };
}
