"use server";
/** «Tracker e tipi» (V-14): a new tracker, and archiving one. The session's owner, core/kinds checks. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { kindRegistry } from "@/core/kinds";
import {
  buildUserKind,
  createUserKind,
  setUserKindArchived,
  takenKindKeys,
  type UserKindError,
  type UserKindInput,
} from "@/core/kinds/user";
import type { TrackerState } from "@/features/account/TrackerForm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WORDS: Record<string, string> = {
  name: "Un nome di 2–40 caratteri.",
  family: "Scegli che cosa è.",
  shape: "Scegli: un momento o con una durata.",
  fields: "Al massimo sei campi.",
  label: "Scrivi la parola del campo.",
  type: "Scegli il tipo del campo.",
  choices: "Almeno due opzioni diverse, separate da virgole.",
  same: "Due campi con la stessa parola.",
};

export async function createTracker(
  prev: TrackerState,
  data: FormData,
): Promise<TrackerState> {
  const owner = await requireOwner();
  let fields: UserKindInput["fields"] = [];
  try {
    const raw = JSON.parse(String(data.get("fields") ?? "[]")) as unknown;
    if (Array.isArray(raw)) fields = raw as UserKindInput["fields"];
  } catch {
    // An unreadable list is no fields: the checks below say what is missing.
  }
  const db = await getDb();
  const taken = await takenKindKeys(db, owner);
  for (const k of kindRegistry().all) taken.add(k.key);
  const built = buildUserKind(
    {
      name: String(data.get("name") ?? ""),
      family: String(data.get("family") ?? ""),
      shape: String(data.get("shape") ?? ""),
      fields,
    },
    taken,
  );
  if (!built.ok) {
    const errors: Record<string, string> = {};
    for (const x of built.errors as UserKindError[])
      if (typeof x === "string") errors[x === "fields" ? "form" : x] = WORDS[x]!;
      else errors["field." + x.field] = WORDS[x.error]!;
    return { errors, n: prev.n + 1 };
  }
  await createUserKind(db, owner, built.row);
  revalidatePath("/", "layout");
  redirect("/impostazioni/tipi?fatto=" + built.row.key);
}

export async function archiveTracker(id: string, archived: boolean): Promise<void> {
  if (!UUID.test(id)) return;
  await setUserKindArchived(await getDb(), await requireOwner(), id, archived);
  revalidatePath("/", "layout");
}
