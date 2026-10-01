/**
 * app/(app)/pantry/actions.ts — server actions for the pantry (ADR-0017):
 * products, purchases, counts, batches, portions and reminders. Same four
 * steps as every action: who? valid? do it, refresh. Deletes go to the
 * trash with Undo (ADR-0015).
 */
"use server";

import { revalidatePath } from "next/cache";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  cookBatch,
  deleteBatch,
  restoreBatch,
} from "@/core/nutrition/repositories/batches";
import { logPortion } from "@/core/nutrition/repositories/log";
import {
  addCount,
  addPurchase,
  createProduct,
  deleteProduct,
  deletePurchase,
  restoreProduct,
  restorePurchase,
  updateProduct,
} from "@/core/pantry/repositories/products";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  restoreReminder,
} from "@/core/pantry/repositories/reminders";
import {
  countInput,
  productInput,
  purchaseInput,
  reminderInput,
} from "@/core/pantry/validation";
import { todayIn } from "@/core/shared/dates";
import type { FormState } from "@/core/shared/result";
import { parseInput } from "@/core/shared/validation";

type Outcome = { ok: boolean; message?: string };

const refresh = () => revalidatePath("/", "layout"); // pantry, day page, trash

export async function createProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(productInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await createProduct(getDb(), owner, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  refresh();
  return { status: "saved" };
}

export async function updateProductAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(productInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await updateProduct(getDb(), owner, id, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  refresh();
  return { status: "saved" };
}

export async function deleteProductAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await deleteProduct(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  refresh();
  return { ok: true };
}

export async function restoreProductAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await restoreProduct(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  refresh();
  return { ok: true };
}

/** Bound to the product: the form sends day, packages, price, shop. */
export async function addPurchaseAction(
  productId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(purchaseInput, { ...values, productId });
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await addPurchase(getDb(), owner, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  refresh();
  return { status: "saved" };
}

export async function deletePurchaseAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await deletePurchase(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  refresh();
  return { ok: true };
}

export async function restorePurchaseAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await restorePurchase(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  refresh();
  return { ok: true };
}

/** "I have this much now": the form sends the quantity; the item is bound. */
export async function addCountAction(
  target: { ingredientId: string | null; productId: string | null },
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(countInput, {
    quantity: values.quantity ?? "",
    ingredientId: target.ingredientId ?? "",
    productId: target.productId ?? "",
  });
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await addCount(getDb(), owner, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  refresh();
  return { status: "saved" };
}

export async function cookBatchAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner, settings } = await requireContext();
  const values = formToObject(formData);
  const portions = Number(values.portions);
  const r = await cookBatch(getDb(), owner, {
    mealId: values.mealId ?? "",
    portions: Number.isInteger(portions) ? portions : 0,
    day: todayIn(settings.timezone),
    cookedAt: new Date(),
  });
  if (!r.ok) return { status: "error", errors: r.errors, values };
  refresh();
  return { status: "saved" };
}

/** One portion eaten today, now (the batch's "⋯" / button). */
export async function eatPortionAction(batchId: string): Promise<Outcome> {
  const { owner, settings, t } = await requireContext();
  const r = await logPortion(getDb(), owner, {
    batchId,
    day: todayIn(settings.timezone),
    servings: "1",
  });
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  refresh();
  return { ok: true };
}

export async function deleteBatchAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await deleteBatch(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  refresh();
  return { ok: true };
}

export async function restoreBatchAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await restoreBatch(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  refresh();
  return { ok: true };
}

export async function createReminderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(reminderInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  await createReminder(getDb(), owner, input.value);
  refresh();
  return { status: "saved" };
}

export async function completeReminderAction(id: string): Promise<Outcome> {
  const { owner, settings, t } = await requireContext();
  const r = await completeReminder(getDb(), owner, id, todayIn(settings.timezone));
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  refresh();
  return { ok: true };
}

export async function deleteReminderAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await deleteReminder(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  refresh();
  return { ok: true };
}

export async function restoreReminderAction(id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  const r = await restoreReminder(getDb(), owner, id);
  if (!r.ok) return { ok: false, message: t.errors.not_found };
  refresh();
  return { ok: true };
}
