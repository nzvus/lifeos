"use server";
/** «Spesa» (V-11): the session's owner, the amount and the time checked, the movement written or changed. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import type { Db } from "@/core/db/db";
import { instantAt } from "@/core/engines/time";
import { trashEntry } from "@/core/entries";
import type { Owner } from "@/core/identity/owner";
import {
  checkAmount,
  createMovement,
  readCategories,
  updateMovement,
  type Movement,
} from "@/core/money";
import type { MovementState } from "@/features/money/MovementForm";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The form read and checked: the movement, or the errors in words. */
async function readForm(
  db: Db,
  owner: Owner,
  form: Record<string, string>,
): Promise<
  { ok: true; m: Omit<Movement, "id"> } | { ok: false; errors: Record<string, string> }
> {
  const day = form["day"] ?? "";
  if (!ISO.test(day))
    return { ok: false, errors: { form: "Il giorno non torna: riapri da ⊕." } };
  const cents = checkAmount(form["amount"] ?? "");
  if (cents === null)
    return { ok: false, errors: { amount: "Scrivi quanto, per esempio 12,50." } };
  const t = /^(\d{2}):(\d{2})$/.exec(form["start"] ?? "");
  if ((form["start"] ?? "") !== "" && !t)
    return { ok: false, errors: { start: "Un’ora come 13:30." } };
  const cats = await readCategories(db, owner);
  const category = cats.find((c) => c.id === form["category"]) ?? null;
  const { clock } = await ownerClock();
  return {
    ok: true,
    m: {
      day,
      startAt: t ? instantAt(day, Number(t[1]) * 60 + Number(t[2]), clock) : null,
      cents: form["direction"] === "in" ? cents : -cents,
      categoryId: category?.id ?? null,
      shop: (form["shop"] ?? "").trim().slice(0, 80),
      method: form["method"] === "cash" ? "cash" : "card",
      note: (form["note"] ?? "").trim().slice(0, 200),
    },
  };
}

const formOf = (data: FormData) => {
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  return form;
};

export async function saveMovement(
  prev: MovementState,
  data: FormData,
): Promise<MovementState> {
  const owner = await requireOwner();
  const form = formOf(data);
  const db = await getDb();
  const r = await readForm(db, owner, form);
  if (!r.ok) return { errors: r.errors, values: form, n: prev.n + 1 };
  await createMovement(db, owner, r.m);
  revalidatePath("/", "layout");
  redirect("/oggi/" + r.m.day);
}

export async function changeMovement(
  id: string,
  prev: MovementState,
  data: FormData,
): Promise<MovementState> {
  const owner = await requireOwner();
  const form = formOf(data);
  const db = await getDb();
  const r = await readForm(db, owner, form);
  if (!r.ok) return { errors: r.errors, values: form, n: prev.n + 1 };
  const { day: _day, ...rest } = r.m;
  if (!UUID.test(id) || !(await updateMovement(db, owner, id, rest)))
    return {
      errors: { form: "Questo movimento non c’è più." },
      values: form,
      n: prev.n + 1,
    };
  revalidatePath("/", "layout");
  redirect("/oggi/" + r.m.day);
}

export async function removeMovement(id: string, day: string): Promise<void> {
  if (!UUID.test(id) || !ISO.test(day)) return;
  await trashEntry(await getDb(), await requireOwner(), id);
  revalidatePath("/", "layout");
  redirect("/oggi/" + day);
}
