/**
 * A logged entry opened from Oggi's «›» (`/voce/<id>`): a meal in its
 * composer with its own lines, a plain kind in its sheet, both filled with
 * what was logged. The other kinds' editors (a session, a movement) come
 * with their slices.
 */
import { notFound } from "next/navigation";
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDay, readMicroTargets } from "@/core/day";
import { readTargetsFor } from "@/core/energy";
import { readEntry } from "@/core/entries";
import {
  readFoodChoices,
  readFoodEstimates,
  readRecipeChoices,
} from "@/core/food/catalog";
import { lineChoices } from "@/core/food/choices";
import { typedEstimate } from "@/core/food/meal";
import { EntrySheet } from "@/features/day/EntrySheet";
import { entryForm, formOf } from "@/features/day/entry-form";
import { foodIds, presentDay } from "@/features/day/nutrients";
import { Composer } from "@/features/food/Composer";
import { addContext } from "../../aggiungi/kinds";
import { updateMeal, updateSheet } from "./actions";
import { changeMovement, removeMovement } from "../../aggiungi/spesa/actions";
import { readCategories } from "@/core/money";
import { MovementForm } from "@/features/money/MovementForm";
import { categoryOptions } from "@/features/money/options";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EntryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const item = await readEntry(db, owner, id);
  if (!item) notFound();
  const ctx = await addContext(db, owner, item.day);
  const dayHref = item.day === ctx.today ? "/oggi" : "/oggi/" + item.day;
  const dayLabel = item.day === ctx.today ? "Oggi" : F.Day(item.day);
  const initial = formOf(item, ctx.clock.timeZone);

  if (item.kind.key === "meal") {
    const [choices, dayData, targets, micros] = await Promise.all([
      readFoodChoices(db, owner, ctx.today),
      loadDay(db, owner, item.day, ctx),
      readTargetsFor(db, owner, item.day, ctx.today, ctx.clock),
      readMicroTargets(db, owner, item.day),
    ]);
    // The day without this meal, so the preview adds it once.
    const others = {
      ...dayData,
      timed: dayData.timed.filter((i) => i.id !== id),
      untimed: dayData.untimed.filter((i) => i.id !== id),
    };
    const role = item.values["role"];
    const kinds = await readFoodEstimates(db, owner, foodIds(dayData));
    const recipes = await readRecipeChoices(db, owner, ctx.today, choices);
    // A meal typed as an estimate opens as typed.
    const est = typedEstimate(item.values, item.lines);
    const typed = est
      ? {
          estimate: "yes",
          estName: est.name,
          ...Object.fromEntries(
            Object.entries(est.totals).map(([f, t]) => [
              "est." + f,
              F.input(Number(t), 2),
            ]),
          ),
        }
      : {};
    return (
      <Composer
        choices={choices}
        recipes={recipes}
        initialRecipe={item.item?.id ?? ""}
        extraChoices={lineChoices(item.lines, kinds)}
        initialLines={(est ? [] : item.lines).map((l) => ({
          key: "line:" + l.id,
          quantity: F.input(Number(l.quantity), 2),
        }))}
        title="Modifica pasto"
        repeatHref={"/aggiungi/pasto?da=" + id}
        backLabel={dayLabel}
        day={item.day}
        dayLabel={dayLabel}
        dayNutrients={presentDay(others, targets, kinds)?.nutrients ?? null}
        refs={{ targets, micros }}
        roleBounds={ctx.roleBounds}
        initial={{
          ...initial,
          role: typeof role === "string" ? role : "",
          servings:
            typeof item.values["servings"] === "string"
              ? F.input(Number(item.values["servings"]), 2)
              : "1",
          ...typed,
        }}
        backHref={dayHref}
        action={updateMeal.bind(null, id)}
      />
    );
  }

  // A movement opens its own form (V-11), with what it holds and «Elimina».
  if (item.kind.key === "movement" && item.money) {
    const m = item.money;
    return (
      <MovementForm
        categories={categoryOptions(await readCategories(db, owner))}
        initial={{
          day: item.day,
          direction: m.amountCents > 0 ? "in" : "out",
          amount: F.input(Math.abs(m.amountCents) / 100, 2),
          category: m.categoryId ?? "",
          shop: m.shop,
          note: item.note,
          method: m.method === "cash" ? "cash" : "card",
          start: initial["start"] ?? "",
        }}
        backHref={dayHref}
        backLabel={dayLabel}
        action={changeMovement.bind(null, id)}
        remove={removeMovement.bind(null, id, item.day)}
      />
    );
  }
  const kind = ctx.kinds.find((k) => k.key === item.kind.key);
  if (!kind) notFound();
  return (
    <EntrySheet
      form={entryForm(kind)}
      day={item.day}
      dayLabel={dayLabel}
      initial={initial}
      closeHref={dayHref}
      action={updateSheet.bind(null, id)}
    />
  );
}
