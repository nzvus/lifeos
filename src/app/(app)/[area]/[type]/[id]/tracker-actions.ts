"use server";
/**
 * «Nuovo tracker» (PAT-11; the tracker's specialisation, core/kinds/user): builds and saves his
 * new type, then opens its page `/oggi/tracker/<id>`. Moved from Profilo's «Tracker e tipi»
 * (change 2026-11-06-tracker).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { kindRegistry } from "@/core/kinds";
import {
  buildUserKind,
  createUserKind,
  takenKindKeys,
  userKindId,
  type UserKindError,
  type UserKindInput,
} from "@/core/kinds/user";
import type { TrackerState } from "@/features/account/TrackerForm";

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
  const key = await createUserKind(db, owner, built.row);
  const id = await userKindId(db, owner, key);
  revalidatePath("/", "layout");
  redirect(id ? "/oggi/tracker/" + id : "/oggi/elenco");
}
