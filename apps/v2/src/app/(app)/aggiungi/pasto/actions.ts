"use server";
/**
 * Saving a meal from the composer (V-04): the session's owner; the lines
 * the browser sent, each only a choice's key and a quantity, checked
 * against the catalog read again here (the snapshot comes from the server,
 * ADR-0007); the meal's role, time and status checked as any entry's.
 * On an error the composer gets the words and what was typed; on success
 * the day it was for.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { checkEntry, createEntry } from "@/core/entries";
import { readFoodChoices } from "@/core/food/catalog";
import { checkMealLines, type LineInput } from "@/core/food/meal";
import { kindRegistry } from "@/core/kinds";
import { clockToDayMin, errorWords } from "@/features/day/entry-form";
import type { MealState } from "@/features/food/Composer";
import { LINE_WORDS } from "@/features/food/composer";
import { addContext } from "../kinds";

/** The lines as sent: anything else than a list of { key, quantity } strings is none. */
function linesOf(raw: string): LineInput[] {
  try {
    const x: unknown = JSON.parse(raw);
    if (!Array.isArray(x) || x.length > 100) return [];
    return x.flatMap((l: unknown) =>
      l !== null &&
      typeof l === "object" &&
      typeof (l as LineInput).key === "string" &&
      typeof (l as LineInput).quantity === "string"
        ? [{ key: (l as LineInput).key, quantity: (l as LineInput).quantity }]
        : [],
    );
  } catch {
    return [];
  }
}

export async function saveMeal(prev: MealState, data: FormData): Promise<MealState> {
  const owner = await requireOwner();
  const db = await getDb();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const lines = linesOf(form["lines"] ?? "");
  const ctx = await addContext(db, owner, form["day"]);
  const choices = await readFoodChoices(db, owner, ctx.today);
  const checkedLines = checkMealLines(lines, new Map(choices.map((c) => [c.key, c])));
  const entry = checkEntry(
    kindRegistry().get("meal"),
    {
      day: ctx.day,
      status: form["status"] === "planned" ? "planned" : "done",
      startMin: clockToDayMin(form["start"] ?? "", ctx.clock.boundaryMin),
      endMin: null,
      values: { role: form["role"] ?? "" },
      note: form["note"] ?? "",
    },
    ctx.clock,
  );
  if (!checkedLines.ok || !entry.ok) {
    const errors: Record<string, string> = entry.ok ? {} : errorWords(entry.errors);
    // A meal's own field is "role" on the composer, not the entry sheet's "v.role".
    if (errors["v.role"]) errors["role"] = errors["v.role"]!;
    if (!checkedLines.ok) {
      if (checkedLines.lines) errors["lines"] = LINE_WORDS[checkedLines.lines];
      for (const [i, code] of Object.entries(checkedLines.at))
        errors["line." + i] = LINE_WORDS[code];
    }
    return { errors, values: form, lines, n: prev.n + 1 };
  }
  await createEntry(db, owner, { ...entry.entry, lines: checkedLines.lines });
  revalidatePath("/oggi", "layout");
  redirect(ctx.day === ctx.today ? "/oggi" : "/oggi/" + ctx.day);
}
