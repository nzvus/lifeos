"use server";
/**
 * ⊕ → «Assunzione» (FOOD-44, ADR-0060): one tap logs an item at its dose and
 * goes back to the day with its toast; «Nuova assunzione» makes the item —
 * a food whose values per 100 come from what one dose carries.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { createFood, setIntake } from "@/core/food/edit";
import { recipeName } from "@/core/food/recipes";
import { logIntake } from "../../oggi/[[...day]]/actions";

export async function logIntakeAndBack(day: string, foodId: string): Promise<void> {
  const id = await logIntake(day, foodId);
  redirect("/oggi/" + day + (id ? "?fatto=" + id : ""));
}

export type IntakeFormState = {
  errors: Record<string, string>;
  values: Record<string, string>;
  n: number;
};

const NUM = /^\d{1,5}(\.\d{1,3})?$/;

/** Per dose → per 100 of the food's unit. */
const per100 = (x: string, dose: string) =>
  String(Math.round((Number(x) / Number(dose)) * 100 * 1000) / 1000);

export async function newIntake(
  back: string,
  prev: IntakeFormState,
  data: FormData,
): Promise<IntakeFormState> {
  const form: Record<string, string> = {};
  for (const [k, v] of data.entries())
    if (typeof v === "string") form[k] = v.trim().replace(",", ".");
  const errors: Record<string, string> = {};
  const name = recipeName(form["name"] ?? "");
  if (!name.ok) errors["name"] = "Dai un nome, per esempio Caffè o Magnesio.";
  const dose = form["dose"] ?? "";
  if (!NUM.test(dose) || !(Number(dose) > 0))
    errors["dose"] = "Quanto pesa una dose, per esempio 7,2 o 3.";
  for (const f of ["kcal", "caffeine", "creatine"])
    if (form[f] && !NUM.test(form[f]!))
      errors[f] = "Scrivi un numero, per esempio 2 o 0,5.";
  if (Object.keys(errors).length > 0 || !name.ok)
    return { errors, values: form, n: prev.n + 1 };
  const unit = form["unit"] === "ml" ? "ml" : "g";
  const db = await getDb();
  const owner = await requireOwner();
  const extra: Record<string, string> = {};
  if (form["caffeine"]) extra["caffeine"] = per100(form["caffeine"], dose);
  if (form["creatine"]) extra["creatine"] = per100(form["creatine"], dose);
  const made = await createFood(
    db,
    owner,
    name.name,
    unit,
    { kcal: form["kcal"] ? per100(form["kcal"], dose) : "0" },
    null,
    extra,
  );
  if (made === "taken")
    return {
      errors: { name: "Hai già un cibo con questo nome." },
      values: form,
      n: prev.n + 1,
    };
  await setIntake(db, owner, made.id, {
    intake: true,
    dose,
    doseName: (form["doseName"] ?? "").slice(0, 30) || null,
  });
  revalidatePath("/", "layout");
  redirect(back);
}
