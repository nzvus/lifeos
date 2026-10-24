/**
 * Libreria (flows.md §1, V-07; the board: an index): the shelves and one
 * search, or a shelf's list with `?vista=cibi|pasti|esercizi`.
 */
import { F, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
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
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const foods = await readFoodChoices(db, owner, today);
  const [recipes, exercises, log] = await Promise.all([
    readRecipeChoices(db, owner, today, foods),
    readExercises(db, owner),
    readExerciseLog(db, owner),
  ]);
  const food = foodRows(foods);
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
