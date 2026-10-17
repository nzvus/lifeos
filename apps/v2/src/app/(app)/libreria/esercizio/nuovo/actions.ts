"use server";
/** Saving «Nuovo esercizio» (V-07): the session's owner, the form checked, then created. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { GUIDES, type GuideKey } from "@/core/engines/training";
import { recipeName } from "@/core/food/recipes";
import { createExercise, EQUIPMENT } from "@/core/training";
import type { ExerciseFormState } from "@/features/library/ExerciseForm";

export async function saveExercise(
  prev: ExerciseFormState,
  data: FormData,
): Promise<ExerciseFormState> {
  const owner = await requireOwner();
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const again = (errors: Record<string, string>) => ({
    errors,
    values: form,
    n: prev.n + 1,
  });
  const name = recipeName(form["name"] ?? "");
  if (!name.ok)
    return again({
      name:
        name.error === "empty"
          ? "Dai un nome all’esercizio."
          : "Al massimo 80 caratteri.",
    });
  const pattern =
    (form["pattern"] ?? "") in GUIDES ? (form["pattern"] as GuideKey) : null;
  const equipment = EQUIPMENT.find((x) => x === form["equipment"]) ?? null;
  const made = await createExercise(await getDb(), owner, name.name, {
    pattern,
    equipment,
    unilateral: form["unilateral"] === "yes",
  });
  if (made === "taken") return again({ name: "Hai già un esercizio con questo nome." });
  revalidatePath("/libreria", "layout");
  redirect("/libreria/esercizio/" + made.id);
}
