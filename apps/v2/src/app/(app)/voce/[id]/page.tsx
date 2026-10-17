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
import { loadDay, readDayTargets } from "@/core/day";
import { readEntry } from "@/core/entries";
import {
  readFoodChoices,
  readFoodEstimates,
  readRecipeChoices,
} from "@/core/food/catalog";
import { lineChoices } from "@/core/food/choices";
import { EntrySheet } from "@/features/day/EntrySheet";
import { entryForm, formOf } from "@/features/day/entry-form";
import { foodIds, presentDay } from "@/features/day/nutrients";
import { Composer } from "@/features/food/Composer";
import { addContext } from "../../aggiungi/kinds";
import { updateMeal, updateSheet } from "./actions";

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
    const [choices, dayData, targets] = await Promise.all([
      readFoodChoices(db, owner, ctx.today),
      loadDay(db, owner, item.day),
      readDayTargets(db, owner, item.day),
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
    return (
      <Composer
        choices={choices}
        recipes={recipes}
        initialRecipe={item.item?.id ?? ""}
        extraChoices={lineChoices(item.lines, kinds)}
        initialLines={item.lines.map((l) => ({
          key: "line:" + l.id,
          quantity: F.n(Number(l.quantity), 2),
        }))}
        title="Modifica pasto"
        backLabel={dayLabel}
        day={item.day}
        dayLabel={dayLabel}
        dayNutrients={presentDay(others, targets, kinds)?.nutrients ?? null}
        roleBounds={ctx.roleBounds}
        initial={{ ...initial, role: typeof role === "string" ? role : "" }}
        backHref={dayHref}
        action={updateMeal.bind(null, id)}
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
