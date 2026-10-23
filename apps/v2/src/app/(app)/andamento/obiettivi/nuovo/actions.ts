"use server";
/** Saving «Nuovo obiettivo» (V-09): the session's owner, the form checked by core, then created from today. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { checkGoal, createGoal } from "@/core/goals";
import type { GoalFormState } from "@/features/progress/GoalForm";

const WORDS = {
  kind: "Scegli cosa.",
  value: "Un numero sensato: kg tra 30 e 250, passi tra 500 e 50.000, ore tra 0,5 e 80.",
  by: "Una data dopo oggi, come 2026-12-20.",
};

export async function saveGoal(
  prev: GoalFormState,
  data: FormData,
): Promise<GoalFormState> {
  const owner = await requireOwner();
  const db = await getDb();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const checked = checkGoal(
    {
      kind: form["kind"] ?? "",
      value: form["value"] ?? "",
      by: form["by"] ?? "",
      weekdays: form["weekdays"] ?? "",
    },
    today,
  );
  if (!checked.ok)
    return {
      errors: Object.fromEntries(
        Object.keys(checked.at).map((k) => [k, WORDS[k as keyof typeof WORDS]]),
      ),
      values: form,
      n: prev.n + 1,
    };
  await createGoal(db, owner, checked, today);
  revalidatePath("/andamento", "layout");
  redirect("/andamento/obiettivi");
}
