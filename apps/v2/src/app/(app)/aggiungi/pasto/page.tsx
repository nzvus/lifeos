/**
 * The meal composer (V-04) for a day: `/aggiungi/pasto?giorno=…`, starting
 * from a saved meal (`&pasto=`), a logged one (`&da=`) or one food (`&cibo=`,
 * from ⊕'s search: at the quantity of its last time). The
 * server reads the person's foods as choices, the day as it is (its
 * Nutrients against the targets in force) and the role bounds; the client
 * composes and posts to `saveMeal`.
 */
import { readDayPlans, readModelBook, resolveModel, toModels } from "@/core/plans";
import { daySlots } from "@/features/day/slots";
import { F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDay, readMicroTargets } from "@/core/day";
import { readTargetsFor } from "@/core/energy";
import { localParts } from "@/core/engines/time";
import {
  readFoodChoices,
  readFoodEstimates,
  readRecipeChoices,
} from "@/core/food/catalog";
import { foodIds, presentDay } from "@/features/day/nutrients";
import { Composer } from "@/features/food/Composer";
import { readEntry } from "@/core/entries";
import { typedEstimate } from "@/core/food/meal";
import { quantityOf, repeatLines } from "@/features/food/composer";
import { addContext } from "../kinds";
import { saveMeal } from "./actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ROLES = new Set(["breakfast", "lunch", "snack", "dinner"]);

export default async function MealPage({
  searchParams,
}: {
  searchParams: Promise<{
    giorno?: string | string[];
    pasto?: string | string[];
    da?: string | string[];
    /** From a model's block on Oggi: its meal role and time. */
    ruolo?: string | string[];
    ora?: string | string[];
    cibo?: string | string[];
    /** From ⊕'s switch: planned, or done earlier (the time to say). */
    stato?: string | string[];
  }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { giorno, pasto, da, ruolo, ora, cibo, stato } = await searchParams;
  const when = stato === "previsto" || stato === "prima" ? stato : null;
  const { clock, roleBounds, day, today } = await addContext(db, owner, giorno);
  const [choices, dayData, targets, micros] = await Promise.all([
    readFoodChoices(db, owner, today),
    loadDay(db, owner, day, { clock, roleBounds }),
    readTargetsFor(db, owner, day, today, clock),
    readMicroTargets(db, owner, day),
  ]);
  const whole = presentDay(
    dayData,
    targets,
    await readFoodEstimates(db, owner, foodIds(dayData)),
  );
  const recipes = await readRecipeChoices(db, owner, today, choices);
  // The day's model's meal blocks (day-templates): each role's targets, for the bars and the gap.
  const model = (await readDayPlans(db, owner, day, day, today)).get(day)?.model ?? null;
  const book = model ? await readModelBook(db, owner) : null;
  const slots = Object.fromEntries(
    [
      ...daySlots(
        book
          ? (resolveModel(model!.id, toModels(book.models, book.rows))?.blocks ?? [])
          : [],
        targets,
      ),
    ].map(([role, t]) => [
      role,
      { kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat, fibre: t.fibre },
    ]),
  );
  // `?pasto=<recipe>` (a saved meal's «Registra»): the composer starts with its foods.
  const from = recipes.find((r) => r.recipeId === pasto);
  // `?da=<entry>` (a logged meal's «Registra di nuovo»): its foods at today's values.
  const again =
    !from && typeof da === "string" && UUID.test(da)
      ? await readEntry(db, owner, da)
      : null;
  const typed =
    again?.kind.key === "meal" ? typedEstimate(again.values, again.lines) : null;
  const repeat =
    again?.kind.key === "meal" && !typed
      ? repeatLines(again.lines, new Set(choices.map((c) => c.key)))
      : null;
  // `?cibo=<food>` (⊕'s search): the composer starts with that food.
  const one = !from && !again ? choices.find((c) => c.key === cibo) : undefined;
  const asked = typeof ruolo === "string" && ROLES.has(ruolo) ? ruolo : null;
  const role = again?.values["role"] ?? asked;
  const at = typeof ora === "string" && /^\d{2}:\d{2}$/.test(ora) ? ora : null;
  const now = F.time(localParts(new Date(), clock.timeZone).minute);
  return (
    <Composer
      choices={choices}
      recipes={recipes}
      {...(from?.estimate
        ? { initialRecipe: from.recipeId }
        : from
          ? {
              initialRecipe: from.recipeId,
              initialLines: from.parts.map((p) => ({
                key: p.key,
                quantity: F.input(Number(p.quantity), 2),
              })),
            }
          : one
            ? {
                initialLines: [
                  {
                    key: one.key,
                    quantity: quantityOf(one.lastQty ?? "")
                      ? F.input(Number(quantityOf(one.lastQty ?? "")), 2)
                      : "100",
                  },
                ],
              }
            : repeat
              ? {
                  initialLines: repeat.lines,
                  ...(again?.item ? { initialRecipe: again.item.id } : {}),
                }
              : typed && again?.item
                ? { initialRecipe: again.item.id }
                : {})}
      day={day}
      dayLabel={day === today ? "Oggi" : F.Day(day)}
      dayNutrients={whole?.nutrients ?? null}
      slots={slots}
      modelName={model?.name ?? null}
      refs={{ targets, micros }}
      roleBounds={roleBounds}
      initial={{
        // A model's block still to come is planned at its time; else now, eaten.
        status:
          when === "previsto" ||
          (when === null && (day > today || (at !== null && day === today && at > now)))
            ? "planned"
            : "done",
        ...(at !== null
          ? { start: at }
          : day === today && when === null
            ? { start: now }
            : {}),
        ...(typeof role === "string" ? { role } : {}),
        ...(typeof again?.values["servings"] === "string"
          ? { servings: F.input(Number(again.values["servings"]), 2) }
          : {}),
        ...(from?.estimate
          ? {
              estimate: "yes",
              estName: from.name,
              ...Object.fromEntries(
                Object.entries(from.estimate).map(([f, t]) => [
                  "est." + f,
                  F.input(Number(t), 2),
                ]),
              ),
            }
          : {}),
        ...(typed
          ? {
              estimate: "yes",
              estName: typed.name,
              ...Object.fromEntries(
                Object.entries(typed.totals).map(([f, t]) => [
                  "est." + f,
                  F.input(Number(t), 2),
                ]),
              ),
            }
          : {}),
      }}
      backHref={`/aggiungi?giorno=${day}`}
      action={saveMeal}
    />
  );
}
