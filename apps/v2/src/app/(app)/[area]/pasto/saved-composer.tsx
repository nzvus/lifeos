/**
 * The composer as the editor of a saved meal (ledger FOOD-42): new
 * (`/cibo/pasto/nuovo`, «Parti da…» with `?da=`) or changed
 * (`/cibo/pasto/<id>/modifica`). The person's foods and saved meals as
 * choices, today's targets for the meal's score, no day around it.
 */
import { F } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readMicroTargets } from "@/core/day";
import { readTargetsFor } from "@/core/energy";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
import type { RecipeChoice } from "@/core/food/choices";
import { Composer, type MealState } from "@/features/food/Composer";
import { addContext } from "../../aggiungi/kinds";

/** A saved meal's foods or typed totals as the composer's starting values. */
function startFrom(r: RecipeChoice | undefined, name: string) {
  if (!r) return { lines: [], values: { recipeName: name } };
  if (r.estimate)
    return {
      lines: [],
      values: {
        recipeName: name,
        estimate: "yes",
        ...Object.fromEntries(
          Object.entries(r.estimate).map(([f, t]) => ["est." + f, F.input(Number(t), 2)]),
        ),
      },
    };
  return {
    lines: r.parts.map((p) => ({ key: p.key, quantity: F.input(Number(p.quantity), 2) })),
    values: { recipeName: name },
  };
}

export async function SavedComposer({
  from,
  editing,
  backHref,
  action,
}: {
  /** The saved meal it starts from (its own, when editing). */
  from: string | null;
  /** Editing `from` itself: keeps its name; else a new meal named by the person. */
  editing: boolean;
  backHref: string;
  action: (state: MealState, data: FormData) => Promise<MealState>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock, roleBounds, today } = await addContext(db, owner, undefined);
  const [choices, targets, micros] = await Promise.all([
    readFoodChoices(db, owner, today),
    readTargetsFor(db, owner, today, today, clock),
    readMicroTargets(db, owner, today),
  ]);
  const recipes = await readRecipeChoices(db, owner, today, choices);
  const base = recipes.find((r) => r.recipeId === from);
  const start = startFrom(base, editing && base ? base.name : "");
  return (
    <Composer
      choices={choices}
      recipes={recipes}
      initialLines={start.lines}
      day={today}
      dayLabel="Oggi"
      dayNutrients={null}
      refs={{ targets, micros, weights: (await ownerClock()).weights }}
      roleBounds={roleBounds}
      initial={start.values}
      backLabel={editing ? (base?.name ?? "Pasto") : "Pasti salvati"}
      backHref={backHref}
      action={action}
      saved={{ name: start.values.recipeName }}
    />
  );
}
