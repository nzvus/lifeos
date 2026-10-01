/**
 * app/(app)/settings/trash/actions.ts — the trash page's two actions
 * (ADR-0015): restore a record, or delete it for good. Both take the kind
 * and id from our own render, but a request can be forged: the kind is
 * checked, and the id only reaches the owner-checked repository.
 */
"use server";

import { revalidatePath } from "next/cache";
import { requireContext } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { isTrashKind, purgeFromTrash, restoreFromTrash } from "@/core/trash/trash";

type Outcome = { ok: boolean; message?: string };

export async function restoreFromTrashAction(kind: string, id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  if (!isTrashKind(kind)) return { ok: false, message: t.errors.not_found };
  const r = await restoreFromTrash(getDb(), owner, kind, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/", "layout"); // it is back in its lists and on its day
  return { ok: true };
}

export async function purgeFromTrashAction(kind: string, id: string): Promise<Outcome> {
  const { owner, t } = await requireContext();
  if (!isTrashKind(kind)) return { ok: false, message: t.errors.not_found };
  const r = await purgeFromTrash(getDb(), owner, kind, id);
  if (!r.ok) return { ok: false, message: t.errors[r.errors._form ?? "not_found"] };
  revalidatePath("/settings/trash");
  return { ok: true };
}
