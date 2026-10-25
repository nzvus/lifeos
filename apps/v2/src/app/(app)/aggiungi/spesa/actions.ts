"use server";
/** «Spesa» (V-11): the session's owner, the amount and the time checked, the movement written. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { instantAt } from "@/core/engines/time";
import { checkAmount, createMovement, readCategories } from "@/core/money";
import type { MovementState } from "@/features/money/MovementForm";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function saveMovement(
  prev: MovementState,
  data: FormData,
): Promise<MovementState> {
  const owner = await requireOwner();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  const day = form["day"] ?? "";
  if (!ISO.test(day)) return again({ form: "Il giorno non torna: riapri da ⊕." });
  const cents = checkAmount(form["amount"] ?? "");
  if (cents === null) return again({ amount: "Scrivi quanto, per esempio 12,50." });
  const t = /^(\d{2}):(\d{2})$/.exec(form["start"] ?? "");
  if ((form["start"] ?? "") !== "" && !t) return again({ start: "Un’ora come 13:30." });
  const db = await getDb();
  const cats = await readCategories(db, owner);
  const category = cats.find((c) => c.id === form["category"]) ?? null;
  const { clock } = await ownerClock();
  await createMovement(db, owner, {
    day,
    startAt: t ? instantAt(day, Number(t[1]) * 60 + Number(t[2]), clock) : null,
    cents: form["direction"] === "in" ? cents : -cents,
    categoryId: category?.id ?? null,
    shop: (form["shop"] ?? "").trim().slice(0, 80),
    method: form["method"] === "cash" ? "cash" : "card",
    note: (form["note"] ?? "").trim().slice(0, 200),
  });
  revalidatePath("/", "layout");
  redirect("/oggi/" + day);
}
