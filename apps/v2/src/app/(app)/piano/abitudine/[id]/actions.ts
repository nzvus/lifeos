"use server";
/** Piano's habit editor (dossiers/day-templates.md slice d): the owner, the form checked, core/plans. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readHabits, saveHabit, setHabitActive } from "@/core/plans";
import { readHabit } from "@/features/plan/habit-form";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type HabitFormState = { errors: Record<string, string>; n: number };

/** `id` null makes a new one, then opens Modelli. */
export async function saveHabitForm(
  id: string | null,
  prev: HabitFormState,
  data: FormData,
): Promise<HabitFormState> {
  if (id !== null && !UUID.test(id))
    return { errors: { name: "Abitudine non trovata." }, n: prev.n + 1 };
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries()) if (typeof v === "string") form[k] = v;
  const read = readHabit(form, data.getAll("weekday").map(Number));
  if (!read.ok) return { errors: read.errors, n: prev.n + 1 };
  const owner = await requireOwner();
  const db = await getDb();
  const all = await readHabits(db, owner);
  if (
    all.some((h) => h.id !== id && h.name.toLowerCase() === read.habit.name.toLowerCase())
  )
    return { errors: { name: "Hai già un’abitudine con questo nome." }, n: prev.n + 1 };
  const saved = await saveHabit(db, owner, id, read.habit);
  if (!saved) return { errors: { name: "Abitudine non trovata." }, n: prev.n + 1 };
  revalidatePath("/", "layout");
  revalidatePath("/", "layout");
  redirect("/piano/modelli");
}

export async function pauseHabit(id: string, active: boolean): Promise<void> {
  if (!UUID.test(id)) return;
  await setHabitActive(await getDb(), await requireOwner(), id, active);
  revalidatePath("/", "layout");
  revalidatePath("/", "layout");
}
