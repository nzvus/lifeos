"use server";
/** The verbs of the generic object page (PAT-04, PAT-24): one action, `core/verbs` does the rest. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readForm } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { mergePreview } from "@/core/catalog/merge";
import { act, readObject, undo, type Undo } from "@/core/verbs";
import { areaSlug, catalogType, typeSlug } from "@/core/kinds/catalog";
import type { NewObjectState } from "@/features/objects/NewObjectForm";
import { mergeLines, newFields } from "@/features/objects/present";
import { objects } from "@/i18n/objects";

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

/** PAT-13: the object's name saved in place; the undo puts the old one back. */
export async function objectRename(
  type: string,
  id: string,
  name: string,
): Promise<VerbAnswer> {
  const owner = await requireOwner();
  const r = await act(await getDb(), owner, "edit", type, id, { name });
  revalidatePath("/", "layout");
  return r.ok ? { ok: true, undo: r.undo } : { ok: false, refused: r.refused };
}

/** PAT-18: what moves when `gone` goes into `keep`, said before it is done (PAT-73). */
export async function objectMergePreview(
  type: string,
  keep: string,
  gone: string,
): Promise<string[]> {
  const owner = await requireOwner();
  const db = await getDb();
  const [k, g] = await Promise.all([
    readObject(db, owner, type, keep),
    readObject(db, owner, type, gone),
  ]);
  if (!k || !g || k.id === g.id) return [];
  return mergeLines(await mergePreview(db, owner, g.id), g.name, k.name);
}

/** PAT-18: `gone` goes into `keep`; no undo (merge has none), so it was confirmed first. */
export async function objectMerge(
  type: string,
  keep: string,
  gone: string,
): Promise<VerbAnswer> {
  const owner = await requireOwner();
  if (keep === gone) return { ok: false, refused: "invalid" };
  const r = await act(await getDb(), owner, "merge", type, gone, { into: keep });
  revalidatePath("/", "layout");
  return r.ok ? { ok: true, undo: null } : { ok: false, refused: r.refused };
}

export async function objectUndo(u: Undo): Promise<VerbAnswer> {
  const owner = await requireOwner();
  const r = await undo(await getDb(), owner, u);
  revalidatePath("/", "layout");
  return r.ok ? { ok: true, undo: null } : { ok: false, refused: r.refused };
}

/**
 * PAT-11: a new object of a type with plain declared fields, through `core/verbs` create; then
 * its page, or `then` under it (a ciclo goes on to its steps: «componi»). What was typed comes
 * back with the field's words, or the refusal's.
 */
export async function objectCreate(
  type: string,
  then: string,
  prev: NewObjectState,
  data: FormData,
): Promise<NewObjectState> {
  const t = catalogType(type);
  const specs = t ? newFields(t) : [];
  const { values, errors } = readForm(specs, (k) =>
    typeof data.get(k) === "string" ? String(data.get(k)) : null,
  );
  const again = (e: Record<string, string>): NewObjectState => ({
    errors: e,
    values,
    n: prev.n + 1,
  });
  if (!t) return again({ form: objects.refused.other });
  if (Object.keys(errors).length) return again(errors);
  const { name, ...rest } = values;
  const r = await act(await getDb(), await requireOwner(), "create", type, null, {
    name: String(name ?? ""),
    values: rest,
  });
  if (!r.ok)
    return again(
      r.refused === "name_taken"
        ? { name: objects.refused.name_taken }
        : { form: objects.refused.other },
    );
  revalidatePath("/", "layout");
  redirect(`/${areaSlug(t)}/${typeSlug(t)}/${r.id}${then ? "/" + then : ""}`);
}
