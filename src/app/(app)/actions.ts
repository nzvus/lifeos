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
import { z } from "zod";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { todayIn } from "@/core/shared/dates";
import { getDb } from "@/app/_server/runtime";
import {
  copyDay,
  deleteLogEntry,
  restoreLogEntry,
  restoreLogEntries,
  setEntryLeftOut,
  trashPlanned,
  logIngredient,
  entryTiming,
  logEstimate,
  logMeal,
  logPortion,
  refreshLogEntry,
  setEntryStatus,
  setEntryServings,
  setEntryTime,
} from "@/core/nutrition/repositories/log";
import { setDayProfile, setGoalDeficit } from "@/core/nutrition/repositories/profiles";
import { setDayClosure } from "@/core/nutrition/repositories/closures";
import { clearSleep, setSleep } from "@/core/training/repositories/sleep";
import { sleepInput } from "@/core/training/validation";
import {
  dayProfileInput,
  goalDeficitInput,
  entryServingsInput,
  entryTimeInput,
  estimateInput,
  logIngredientInput,
  logMealInput,
  logPortionInput,
  parseInput,
} from "@/core/nutrition/validation";
import { addDays, instantFor, isValidDay } from "@/core/shared/dates";
import { id as entryId } from "@/core/shared/validation";
import { IDLE, type FormState } from "@/core/shared/result";
import type { ActionButtonState } from "@/ui/ActionButtonForm";
import { setDayActivity, setEnergyCorrection } from "@/core/energy/repositories/energy";
import { activityInput, correctionInput } from "@/core/energy/validation";
import { decideCheckin } from "@/core/energy/repositories/checkin";
import { undoWeekCheckin } from "@/core/energy/repositories/goals";

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

/** A portion from a batch cooked earlier (ADR-0017): like a meal, from a batch. */
export async function logPortionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(logPortionInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const { planned, time, ...rest } = input.value;
  const timing = entryTiming(rest.day, planned, time, settings.timezone);
  const result = await logPortion(getDb(), owner, { ...rest, ...timing });
  if (!result.ok) return { status: "error", errors: result.errors, values };
  revalidatePath("/", "layout"); // the pantry's portions too
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
 * Moves a log entry to the trash (ADR-0015). The id comes from our own
 * render, but a request can be forged, so it is still only used through
 * the owner-checked repository.
 */
export async function deleteLogEntryAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const result = await deleteLogEntry(getDb(), owner, id);
  if (!result.ok) return { ok: false, message: t.errors.not_found };
  revalidatePath("/");
  return { ok: true };
}

/** Takes a log entry out of the trash (the toast's "Undo"). */
export async function restoreLogEntryAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const result = await restoreLogEntry(getDb(), owner, id);
  if (!result.ok) return { ok: false, message: t.errors.not_found };
  revalidatePath("/");
  return { ok: true };
}

/**
 * "Remove what's still planned" on a day (core trashPlanned): the ids come
 * back for the toast's Undo. The day is checked; ids from the browser are
 * used only through the owner-checked repository.
 */
export async function trashPlannedAction(day: string): Promise<string[]> {
  const { owner } = await requireContext();
  if (!isValidDay(day)) return [];
  const ids = await trashPlanned(getDb(), owner, day);
  revalidatePath("/");
  return ids;
}

/** trashPlannedAction's Undo. */
export async function restoreLogEntriesAction(ids: string[]): Promise<void> {
  const { owner } = await requireContext();
  const valid = z.array(entryId).max(200).safeParse(ids);
  if (!valid.success) return;
  await restoreLogEntries(getDb(), owner, valid.data);
  revalidatePath("/");
}

/** A planned entry in or out of the plan's total (core setEntryLeftOut). */
export async function setEntryLeftOutAction(
  id: string,
  out: boolean,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await setEntryLeftOut(getDb(), owner, id, out === true);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  revalidatePath("/");
  return { ok: true };
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

/** The goal line: a dynamic day type's deficit, changed on the day. */
export async function setGoalDeficitAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(goalDeficitInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await setGoalDeficit(
    getDb(),
    owner,
    input.value.day,
    input.value.profileId,
    input.value.deficitKcal,
  );
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout");
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
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const result = await refreshLogEntry(getDb(), owner, id);
  if (!result.ok) return { ok: false, message: t.day.refreshGone };
  revalidatePath("/");
  return { ok: true };
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
  const { owner, settings, t } = await requireContext();
  const result = await setEntryStatus(
    getDb(),
    owner,
    id,
    status,
    new Date(),
    todayIn(settings.timezone),
  );
  if (!result.ok)
    return { status: "error", message: t.errors[result.errors._form ?? "not_found"] };
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

/** An entry's −/+ multiplier (a plain form: works without JavaScript). */
export async function setEntryServingsAction(
  id: string,
  formData: FormData,
): Promise<void> {
  const { owner } = await requireContext();
  const input = parseInput(entryServingsInput, formToObject(formData));
  if (!input.ok) return;
  await setEntryServings(getDb(), owner, id, input.value.servings);
  revalidatePath("/");
}

/** The day's movement besides training (ADR-0014), bound to the day. */
export async function setDayActivityAction(
  day: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(activityInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  await setDayActivity(getDb(), owner, day, input.value);
  revalidatePath("/");
  return { status: "saved" };
}

/** ADR-0042: close a day (complete / partial), or reopen it with null. */
export async function setDayClosureAction(
  day: string,
  state: "complete" | "partial" | null,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, settings, t } = await requireContext();
  if (!isValidDay(day) || day > todayIn(settings.timezone))
    return { ok: false, message: t.errors.future_day };
  if (state !== null && state !== "complete" && state !== "partial")
    return { ok: false, message: t.errors.invalid_choice };
  await setDayClosure(getDb(), owner, day, state);
  revalidatePath("/");
  return { ok: true };
}

/** ADR-0020: accept a calibration proposal, or reset it with 1. */
export async function setEnergyCorrectionAction(
  factor: number,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, settings, t } = await requireContext();
  const parsed = correctionInput.safeParse(factor);
  if (!parsed.success) return { ok: false, message: t.errors.invalid_number };
  await setEnergyCorrection(getDb(), owner, parsed.data, todayIn(settings.timezone));
  revalidatePath("/");
  return { ok: true };
}

/** ADR-0043: accept (fix the next 7 days) or skip the weekly check-in. */
export async function decideCheckinAction(
  decision: "accept" | "skip",
): Promise<{ ok: boolean; message?: string }> {
  const { owner, settings, t } = await requireContext();
  if (decision !== "accept" && decision !== "skip")
    return { ok: false, message: t.errors.invalid_choice };
  const r = await decideCheckin(getDb(), owner, todayIn(settings.timezone), decision);
  if (!r.ok) return { ok: false, message: t.errors[Object.values(r.errors)[0]!] };
  revalidatePath("/", "layout"); // every screen reads the week's targets
  return { ok: true };
}

/** ADR-0048: undo the accepted check-in covering today. */
export async function undoCheckinAction(): Promise<{ ok: boolean; message?: string }> {
  const { owner, settings, t } = await requireContext();
  const r = await undoWeekCheckin(getDb(), owner, todayIn(settings.timezone));
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---- sleep (ADR-0031) -------------------------------------------------------

/** The night that ended on a day; quiet until both times are there (autosave). */
export async function setSleepAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  if (!values.bed || !values.wake) return IDLE;
  const input = parseInput(sleepInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await setSleep(getDb(), owner, input.value, settings.timezone);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function clearSleepAction(day: string): Promise<void> {
  const { owner } = await requireContext();
  if (!isValidDay(day)) return;
  await clearSleep(getDb(), owner, day);
  revalidatePath("/", "layout");
}
