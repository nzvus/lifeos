/**
 * app/(app)/money/actions.ts — server actions of the Money tab (ADR-0036):
 * add, change, trash and restore a movement. Each: requireContext() → core
 * validation → repository → revalidate.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formToObject } from "@/app/_server/forms";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import {
  addMovement,
  deleteMovement,
  restoreMovement,
  updateMovement,
} from "@/core/money/repositories/money";
import { movementInput, receiptInput } from "@/core/money/validation";
import { getApiKey, getKeyStatus } from "@/core/assistant/repositories/assistant";
import { ModelError, openRouterComplete } from "@/core/assistant/model";
import { readWithModel, type ModelReceipt } from "@/core/money/receipts";
import { saveReceipt } from "@/core/money/repositories/receipts";
import { listProducts } from "@/core/pantry/repositories/products";
import { env } from "@/app/_server/env";
import type { FormState } from "@/core/shared/result";
import { parseInput } from "@/core/shared/validation";

export async function addMovementAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(movementInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await addMovement(getDb(), owner, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/money", "layout");
  return { status: "saved" };
}

/** Bound per movement by the edit page; back to where it came from. */
export async function updateMovementAction(
  id: string,
  back: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(movementInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await updateMovement(getDb(), owner, id, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/money", "layout");
  redirect(back);
}

export async function deleteMovementAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await deleteMovement(getDb(), owner, id);
  revalidatePath("/money", "layout");
  return r.ok ? { ok: true } : { ok: false, message: t.errors.not_found };
}

export async function restoreMovementAction(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const { owner, t } = await requireContext();
  const r = await restoreMovement(getDb(), owner, id);
  revalidatePath("/money", "layout");
  return r.ok ? { ok: true } : { ok: false, message: t.errors.not_found };
}

/**
 * A reviewed receipt (core saveReceipt): one transaction; then the movement
 * it became, with its lines.
 */
export async function saveReceiptAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { owner } = await requireContext();
  const values = formToObject(formData);
  const input = parseInput(receiptInput, values);
  if (!input.ok) return { status: "error", errors: input.errors, values };
  const r = await saveReceipt(getDb(), owner, input.value);
  if (!r.ok) return { status: "error", errors: r.errors, values };
  revalidatePath("/", "layout");
  redirect(`/money/${r.value.movementId}?from=/money/receipts`);
}

/**
 * The optional model pass (ADR-0018 key, the model chosen in Settings): the
 * receipt's text and my product names go out, lines come back to review.
 * Nothing is saved here.
 */
export async function readReceiptAction(
  text: string,
): Promise<{ ok: true; receipt: ModelReceipt } | { ok: false; message: string }> {
  const { owner, t } = await requireContext();
  const a = t.assistant;
  if (env().ASSISTANT_ENABLED !== "true") return { ok: false, message: a.noSecret };
  const secret = env().ASSISTANT_KEY_SECRET;
  if (!secret) return { ok: false, message: a.noSecret };
  const db = getDb();
  const [apiKey, status, products] = await Promise.all([
    getApiKey(db, owner, secret),
    getKeyStatus(db, owner),
    listProducts(db, owner),
  ]);
  if (!apiKey) return { ok: false, message: a.noKey };
  try {
    const receipt = await readWithModel(
      openRouterComplete(apiKey, env().baseURL),
      status.model,
      String(text).slice(0, 20000),
      products.map((p) => p.name),
    );
    return receipt
      ? { ok: true, receipt }
      : { ok: false, message: t.money.modelUnreadable };
  } catch (e) {
    if (e instanceof ModelError && e.code !== "model_failed")
      return { ok: false, message: a.errors[e.code] };
    return { ok: false, message: t.money.modelUnreadable };
  }
}
