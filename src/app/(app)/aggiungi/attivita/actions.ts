"use server";
/** ⊕ → «Attività» (dossiers/activity.md): an activity done, saved as a finished session. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { instantAt } from "@/core/engines/time";
import { checkActivity, logActivity, readExercises } from "@/core/training";
import type { ActivityState } from "@/features/training/ActivitySheet";
import { clockToDayMin } from "@/features/day/entry-form";
import { addContext } from "../kinds";
import { isCardio } from "./cardio";

const WORDS = {
  minutes: "La durata in minuti, da 1 a 600.",
  km: "I km sono un numero, per esempio 4,5.",
  rpe: "Da 0 a 10.",
} as const;

export async function saveActivity(
  prev: ActivityState,
  data: FormData,
): Promise<ActivityState> {
  const owner = await requireOwner();
  const db = await getDb();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const ctx = await addContext(db, owner, form["day"]);
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  const exercise = (await readExercises(db, owner)).find(
    (e) => e.id === form["exercise"] && isCardio(e),
  );
  const endMin = clockToDayMin(form["end"] ?? "", ctx.clock.boundaryMin);
  const checked = checkActivity({
    minutes: form["minutes"] ?? "",
    km: form["km"] ?? "",
    rpe: form["rpe"] ?? "",
  });
  const errors: Record<string, string> = {};
  if (!exercise) errors["exercise"] = "Scegli l’attività.";
  if (endMin === null) errors["end"] = "L’ora in cui è finita, per esempio 19:42.";
  if (!checked.ok) for (const k of checked.errors) errors[k] = WORDS[k];
  if (!exercise || endMin === null || !checked.ok) return again(errors);
  const end = instantAt(ctx.day, endMin, ctx.clock);
  if (end.getTime() > Date.now() + 60_000)
    return again({ end: "È un’attività fatta: l’ora non può essere nel futuro." });
  await logActivity(db, owner, {
    day: ctx.day,
    exerciseId: exercise.id,
    label: exercise.name,
    end,
    activity: checked.activity,
  });
  revalidatePath("/", "layout");
  redirect(ctx.day === ctx.today ? "/oggi" : "/oggi/" + ctx.day);
}
