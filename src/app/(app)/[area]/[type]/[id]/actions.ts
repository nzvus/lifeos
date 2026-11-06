"use server";
/** The verbs of the generic object page (PAT-04, PAT-24): one action, `core/verbs` does the rest. */
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { act, undo, type Undo } from "@/core/verbs";

/** The verbs this page runs itself; «Unisci» and «Parti da…» open their sheets (PAT-16, PAT-18). */
const SIMPLE = new Set(["archive", "restore", "trash", "delete"] as const);
type Simple = "archive" | "restore" | "trash" | "delete";

export type VerbAnswer = { ok: true; undo: Undo | null } | { ok: false; refused: string };

export async function objectVerb(
  type: string,
  id: string,
  verb: string,
): Promise<VerbAnswer> {
  const owner = await requireOwner();
  if (!SIMPLE.has(verb as Simple)) return { ok: false, refused: "verb_not_allowed" };
  const r = await act(await getDb(), owner, verb as Simple, type, id, {});
  revalidatePath("/", "layout");
  return r.ok ? { ok: true, undo: r.undo } : { ok: false, refused: r.refused };
}

/** PAT-13: one value saved in place; the answer's undo puts the previous one back. */
export async function objectEdit(
  type: string,
  id: string,
  key: string,
  value: string | number | boolean | null,
): Promise<VerbAnswer> {
  const owner = await requireOwner();
  const r = await act(await getDb(), owner, "edit", type, id, {
    values: { [key]: value },
  });
  revalidatePath("/", "layout");
  return r.ok ? { ok: true, undo: r.undo } : { ok: false, refused: r.refused };
}

export async function objectUndo(u: Undo): Promise<VerbAnswer> {
  const owner = await requireOwner();
  const r = await undo(await getDb(), owner, u);
  revalidatePath("/", "layout");
  return r.ok ? { ok: true, undo: null } : { ok: false, refused: r.refused };
}
