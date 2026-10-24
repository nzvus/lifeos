/**
 * Libreria (flows.md §1, V-07; the board: an index): the shelves and one
 * search, or a shelf's list with `?vista=cibi|pasti|esercizi`.
 */
import { F, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import {
  readFoodChoices,
  readFoodEstimates,
  readRecipeChoices,
} from "@/core/food/catalog";
import { readMicroTargets } from "@/core/day";
import { readTargetsFor } from "@/core/energy";
import { foodScore } from "@/features/day/score";
import { readExerciseLog, readExercises } from "@/core/training";
import {
  exerciseRows,
  foodRows,
  LIBRARY_VIEWS,
  recipeRows,
  shelfLines,
} from "@/features/library/library";
import { Library } from "@/features/library/Library";
import { PLACES } from "@/features/places";

export default async function LibreriaPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string | string[] }>;
}) {
  const asked = (await searchParams).vista;
  const view =
    typeof asked === "string" && asked in LIBRARY_VIEWS
      ? LIBRARY_VIEWS[asked as keyof typeof LIBRARY_VIEWS]
      : null;
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const foods = await readFoodChoices(db, owner, today);
  const [recipes, exercises, log] = await Promise.all([
    readRecipeChoices(db, owner, today, foods),
    readExercises(db, owner),
    readExerciseLog(db, owner),
  ]);
  // The foods' list: each scored per 100 kcal (E7) against today's targets; only on its shelf.
  const scored =
    view === "foods"
      ? await Promise.all([
          readTargetsFor(db, owner, today, today, clock),
          readMicroTargets(db, owner, today),
          readFoodEstimates(
            db,
            owner,
            foods.flatMap((f) => (f.productId === null && f.foodId ? [f.foodId] : [])),
          ),
        ])
      : null;
  const food = foodRows(foods).map((r) => {
    const id = r.href?.split("/").at(-1);
    const sc =
      scored && id
        ? foodScore(
            Object.fromEntries(Object.entries(r.values).map(([k, v]) => [k, String(v)])),
            scored[2].get(id),
            scored[0],
            scored[1],
            r.of?.["group"],
          )
        : undefined;
    return sc ? { ...r, score: sc } : r;
  });
  const meal = recipeRows(recipes, foods);
  const exercise = exerciseRows(exercises, log, (d) => F.Day(d));
  return (
    <main className="k-page has-bd">
      {view === null ? (
        <PageHeader
          title="Libreria"
          context="le cose che riusi: cibi, pasti, esercizi"
          of={{ place: "libreria" }}
        />
      ) : (
        <PageHeader
          title={{ foods: "Cibi", meals: "Pasti salvati", exercises: "Esercizi" }[view]}
          back={{ label: "Libreria", href: "/libreria" }}
          of={{ place: "libreria" }}
        />
      )}
      <Library
        foods={food}
        meals={meal}
        exercises={exercise}
        view={view}
        shelfLines={shelfLines(foods, meal, exercise)}
      />
      <div className="k-nav k-stick">
        <NavBar active="library" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
