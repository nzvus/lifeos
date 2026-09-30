/**
 * app/(app)/actions.ts — server actions of the day view (URL /).
 *
 * "use server" marks every exported function as a SERVER ACTION: the browser
 * gets a reference, not the code; calling it sends a POST request that runs
 * the function here, on the server. Forms in features/ receive these as props.
 *
 * Why actions live in app/ rather than in features/ (ARCHITECTURE.md): an
 * action must read the session cookie, and ADR-0006 allows that only in app/.
 * Every action has the same four steps and nothing more:
 *   1. who?      requireContext() -> Owner (or redirect to sign-in)
 *   2. valid?    core validation   -> error codes + submitted values back
 *   3. do it     core repository   -> Result
 *   4. refresh   revalidatePath    -> the page re-renders with fresh data
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  copyDay,
  deleteLogEntry,
  logIngredient,
  entryTiming,
  logEstimate,
  logMeal,
  refreshLogEntry,
  setEntryStatus,
  setEntryTime,
} from "@/core/nutrition/repositories/log";
import { setDayProfile } from "@/core/nutrition/repositories/profiles";
import {
  dayProfileInput,
  entryTimeInput,
  estimateInput,
  logIngredientInput,
  logMealInput,
  parseInput,
} from "@/core/nutrition/validation";
import { addDays, instantFor } from "@/core/shared/dates";
import type { FormState } from "@/core/shared/result";
import type { ActionButtonState } from "@/ui/ActionButtonForm";

export async function logMealAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(logMealInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const { planned, time, ...rest } = input.value;
  const timing = entryTiming(rest.day, planned, time, settings.timezone);
  const result = await logMeal(getDb(), owner, { ...rest, ...timing });
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/");
  return { status: "saved" };
}

export async function logIngredientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(logIngredientInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const { planned, time, ...rest } = input.value;
  const timing = entryTiming(rest.day, planned, time, settings.timezone);
  const result = await logIngredient(getDb(), owner, { ...rest, ...timing });
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/");
  return { status: "saved" };
}

/**
 * Bound per entry: the page passes `deleteLogEntryAction.bind(null, id)`.
 * The id comes from our own render, but a request can be forged, so it is
 * still only used through the owner-checked repository.
 */
export async function deleteLogEntryAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const result = await deleteLogEntry(getDb(), owner, id);
  if (!result.ok)
    return { status: "error", message: t.errors[result.errors._form ?? "not_found"] };
  revalidatePath("/");
  return { status: "idle" };
}

/** "Today is a gym day": copies that profile's targets onto the day (ADR-0008). */
export async function setDayProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(dayProfileInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const result = await setDayProfile(
    getDb(),
    owner,
    input.value.day,
    input.value.profileId,
  );
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/");
  return { status: "saved" };
}

/**
 * "Repeat yesterday": copies the previous day's entries into `day`, as
 * logged (core copyDay). Bound per day by the page. Shown only on an empty
 * day, so a tap can't duplicate a day that already has food.
 */
export async function copyPreviousDayAction(
  day: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const result = await copyDay(getDb(), owner, addDays(day, -1), day);
  if (!result.ok) return { status: "error", message: t.errors.not_found };
  if (result.value.copied === 0)
    return { status: "error", message: t.day.nothingYesterday };
  revalidatePath("/");
  return { status: "idle" };
}

/** "Update with current values" on one entry (core refreshLogEntry). Bound per entry. */
export async function refreshLogEntryAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const result = await refreshLogEntry(getDb(), owner, id);
  if (!result.ok) return { status: "error", message: t.day.refreshGone };
  revalidatePath("/");
  return { status: "idle" };
}

/** "Estimated meal" form (ADR-0009): name + approximate totals. */
export async function logEstimateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(estimateInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const { planned, time, ...rest } = input.value;
  const timing = entryTiming(rest.day, planned, time, settings.timezone);
  const result = await logEstimate(getDb(), owner, { ...rest, ...timing });
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/");
  return { status: "saved" };
}

/** The round checkbox on an entry. Bound per entry with the status to set. */
export async function setEntryStatusAction(
  id: string,
  status: "planned" | "eaten",
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const result = await setEntryStatus(getDb(), owner, id, status);
  if (!result.ok) return { status: "error", message: t.errors.not_found };
  revalidatePath("/");
  return { status: "idle" };
}

/** Edits an entry's time ("HH:MM" on the entry's day, user's time zone). Bound per entry. */
export async function setEntryTimeAction(
  id: string,
  day: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(entryTimeInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const at =
    input.value.time === null
      ? null
      : instantFor(day, input.value.time, settings.timezone);
  const result = await setEntryTime(getDb(), owner, id, at);
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/");
  return { status: "saved" };
}
