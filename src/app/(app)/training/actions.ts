/**
 * app/(app)/training/actions.ts — every training write (ADR-0005): sessions,
 * exercises (and merging), routines, body measurements.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { parseInput } from "@/core/shared/validation";
import type { FormState } from "@/core/shared/result";
import {
  createExercise,
  deleteExercise,
  mergeExercises,
  restoreExercise,
  updateExercise,
} from "@/core/training/repositories/exercises";
import {
  addMeasurement,
  deleteMeasurement,
} from "@/core/training/repositories/measurements";
import {
  createRoutine,
  deleteRoutine,
  restoreRoutine,
  updateRoutine,
} from "@/core/training/repositories/routines";
import {
  createSession,
  deleteSession,
  restoreSession,
  updateSession,
} from "@/core/training/repositories/sessions";
import {
  exerciseInput,
  measurementInput,
  routineInput,
  sessionInput,
} from "@/core/training/validation";
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
  return { status: "saved" };
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

/** Moves a session to the trash (ADR-0015). */
export async function deleteSessionAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await deleteSession(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Takes a session out of the trash (the toast's "Undo"). */
export async function restoreSessionAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await restoreSession(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---- estimated sessions (ADR-0016) -----------------------------------------

/** The estimate form's fields as a session without exercises. */
function estimateValues(formData: FormData) {
  return { ...formToObject(formData), exercises: "[]" };
}

/** Adds an estimated session (the day page's "Add training · Estimate"). */
export async function createEstimateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = estimateValues(formData);
  const input = parseInput(sessionInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await createSession(getDb(), owner, input.value, settings.timezone);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout");
  return { status: "saved" };
}

/** Saves an estimated session's edit page. */
export async function updateEstimateAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = estimateValues(formData);
  const input = parseInput(sessionInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await updateSession(getDb(), owner, id, input.value, settings.timezone);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout");
  return { status: "saved" };
}

// ---- exercises -------------------------------------------------------------

export async function createExerciseAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(exerciseInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await createExercise(getDb(), owner, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/training", "layout");
  return { status: "saved" };
}

export async function updateExerciseAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(exerciseInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await updateExercise(getDb(), owner, id, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/training", "layout");
  return { status: "saved" };
}

/** Moves an unused exercise to the trash (ADR-0015); used ones: "in_use". */
export async function deleteExerciseAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await deleteExercise(getDb(), owner, id);
  if (!r.ok)
    return {
      ok: false,
      message: r.errors._form === "in_use" ? t.exercises.inUse : t.errors.not_found,
    };
  revalidatePath("/training", "layout");
  return { ok: true };
}

/** Takes an exercise out of the trash (the toast's "Undo"). */
export async function restoreExerciseAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await restoreExercise(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/training", "layout");
  return { ok: true };
}

export async function mergeExerciseAction(
  fromId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const intoId = String(formData.get("intoId") ?? "");
  const r = await mergeExercises(getDb(), owner, fromId, intoId);
  if (!r.ok) return { status: "error", errors: r.errors, values: {} };
  revalidatePath("/training", "layout");
  redirect(`/training/exercises/${intoId}`);
}

// ---- routines --------------------------------------------------------------

export async function createRoutineAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(routineInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await createRoutine(getDb(), owner, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/training", "layout");
  return { status: "saved" };
}

export async function updateRoutineAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(routineInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await updateRoutine(getDb(), owner, id, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/training", "layout");
  return { status: "saved" };
}

/** Moves a routine to the trash (ADR-0015); its sessions keep their link. */
export async function deleteRoutineAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await deleteRoutine(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Takes a routine out of the trash (the toast's "Undo"). */
export async function restoreRoutineAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await restoreRoutine(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---- body measurements -----------------------------------------------------

export async function addMeasurementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(measurementInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  await addMeasurement(getDb(), owner, input.value);
  revalidatePath("/", "layout"); // burn estimates everywhere
  return { status: "saved" };
}

export async function deleteMeasurementAction(
  id: string,
  _prev: ActionButtonState,
  _formData: FormData,
): Promise<ActionButtonState> {
  const { owner, t } = await requireContext();
  const r = await deleteMeasurement(getDb(), owner, id);
  if (!r.ok) return { status: "error", message: t.errors.not_found };
  revalidatePath("/", "layout");
  return { status: "idle" };
}
