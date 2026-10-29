"use server";
/**
 * Saving an entry from its sheet (V-03): the session's owner, the kind
 * among those ⊕ offers, the form read and checked by core, then written.
 * On an error the sheet gets the words and what was typed; on success the
 * day it was for.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { checkEntry, createEntry, dailyTotalOf, updateEntry } from "@/core/entries";
import type { SaveState } from "@/features/day/EntrySheet";
import { errorWords, managedFields, readEntryForm } from "@/features/day/entry-form";
import { addContext } from "../kinds";

export async function saveEntry(prev: SaveState, data: FormData): Promise<SaveState> {
  const owner = await requireOwner();
  const db = await getDb();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const ctx = await addContext(db, owner, form["day"]);
  const kind = ctx.kinds.find((k) => k.key === form["kind"]);
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  if (!kind) return again({ form: "Questo tipo non si può aggiungere da qui." });
  const checked = checkEntry(
    kind,
    readEntryForm(kind, ctx.day, form, ctx.clock.boundaryMin),
    ctx.clock,
  );
  if (!checked.ok) return again(errorWords(checked.errors));
  // Steps are the phone's total so far: a new count replaces the day's, never adds to it.
  const total =
    kind.key === "steps" && checked.entry.status === "done"
      ? await dailyTotalOf(db, owner, "steps", checked.entry.day)
      : null;
  if (total) await updateEntry(db, owner, total, checked.entry, managedFields(kind));
  else await createEntry(db, owner, checked.entry);
  revalidatePath("/oggi", "layout");
  redirect(ctx.day === ctx.today ? "/oggi" : "/oggi/" + ctx.day);
}
