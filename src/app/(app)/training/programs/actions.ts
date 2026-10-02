/**
 * app/(app)/training/programs/actions.ts — training programs (ADR-0024):
 * create, update, trash and restore. Slots arrive as one JSON field.
 * ADR-0029: change a coming day, swap two, back to the cycle.
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import type { FormState } from "@/core/shared/result";
import { parseInput } from "@/core/shared/validation";
import { isValidDay, todayIn } from "@/core/shared/dates";
import {
  createProgram,
  deleteProgram,
  resetProgramDay,
  restoreProgram,
  setProgramDay,
  swapProgramDays,
  updateProgram,
  skipProgramDay,
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

type Outcome = { ok: boolean; message?: string };

/**
 * A coming day of the active program: a slot's position, "rest", "skip"
 * (ADR-0035: the slot due passes, not done), or "cycle" (back to what the
 * cycle says).
 */
export async function setProgramDayAction(day: string, value: string): Promise<Outcome> {
  const { owner, settings, t } = await requireContext();
  if (!isValidDay(day)) return { ok: false, message: t.errors.invalid_day };
  const today = todayIn(settings.timezone);
  const db = getDb();
  const r =
    value === "cycle"
      ? await resetProgramDay(db, owner, day)
      : value === "skip"
        ? await skipProgramDay(db, owner, today, day)
        : value === "rest"
          ? await setProgramDay(db, owner, today, day, null)
          : /^\d+$/.test(value)
            ? await setProgramDay(db, owner, today, day, Number(value))
            : null;
  if (!r) return { ok: false, message: t.errors.invalid_choice };
  if (!r.ok) {
    const code = Object.values(r.errors)[0] as keyof typeof t.errors;
    return { ok: false, message: t.errors[code] ?? "" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Two coming days exchange what the program puts on them. */
export async function swapProgramDaysAction(a: string, b: string): Promise<Outcome> {
  const { owner, settings, t } = await requireContext();
  if (!isValidDay(a) || !isValidDay(b))
    return { ok: false, message: t.errors.invalid_day };
  const r = await swapProgramDays(getDb(), owner, todayIn(settings.timezone), a, b);
  if (!r.ok) {
    const code = Object.values(r.errors)[0] as keyof typeof t.errors;
    return { ok: false, message: t.errors[code] ?? "" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
