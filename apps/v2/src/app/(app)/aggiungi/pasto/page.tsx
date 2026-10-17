/**
 * The meal composer (V-04) for a day: `/aggiungi/pasto?giorno=…`. The
 * server reads the person's foods as choices, the day as it is (its
 * Nutrients against the targets in force) and the role bounds; the client
 * composes and posts to `saveMeal`.
 */
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDay, readDayTargets } from "@/core/day";
import { localParts } from "@/core/engines/time";
import {
  readFoodChoices,
  readFoodEstimates,
  readRecipeChoices,
} from "@/core/food/catalog";
import { foodIds, presentDay } from "@/features/day/nutrients";
import { Composer } from "@/features/food/Composer";
import { addContext } from "../kinds";
import { saveMeal } from "./actions";

export default async function MealPage({
  searchParams,
}: {
  searchParams: Promise<{ giorno?: string | string[]; pasto?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { giorno, pasto } = await searchParams;
  const { clock, roleBounds, day, today } = await addContext(db, owner, giorno);
  const [choices, dayData, targets] = await Promise.all([
    readFoodChoices(db, owner, today),
    loadDay(db, owner, day),
    readDayTargets(db, owner, day),
  ]);
  const whole = presentDay(
    dayData,
    targets,
    await readFoodEstimates(db, owner, foodIds(dayData)),
  );
  const recipes = await readRecipeChoices(db, owner, today, choices);
  // `?pasto=<recipe>` (a saved meal's «Registra»): the composer starts with its foods.
  const from = recipes.find((r) => r.recipeId === pasto);
  const now = F.time(localParts(new Date(), clock.timeZone).minute);
  return (
    <Composer
      choices={choices}
      recipes={recipes}
      {...(from
        ? {
            initialRecipe: from.recipeId,
            initialLines: from.parts.map((p) => ({
              key: p.key,
              quantity: F.n(Number(p.quantity), 2),
            })),
          }
        : {})}
      day={day}
      dayLabel={day === today ? "Oggi" : F.Day(day)}
      dayNutrients={whole?.nutrients ?? null}
      roleBounds={roleBounds}
      initial={{
        status: day > today ? "planned" : "done",
        ...(day === today ? { start: now } : {}),
      }}
      backHref={`/aggiungi?giorno=${day}`}
      action={saveMeal}
    />
  );
}
