/** Libreria (flows.md §1, V-07): the catalog's foods and saved meals; exercises and kinds come with their slices. */
import { NavBar, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readClock } from "@/core/day";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
import { foodRows, recipeRows } from "@/features/library/library";
import { Library } from "@/features/library/Library";
import { PLACES } from "@/features/places";

export default async function LibreriaPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const today = logicalDay(new Date(), (await readClock(db, owner)).clock);
  const foods = await readFoodChoices(db, owner, today);
  const recipes = await readRecipeChoices(db, owner, today, foods);
  return (
    <main className="k-page has-bd">
      <PageHeader title="Libreria" of={{ place: "libreria" }} />
      <Library foods={foodRows(foods)} meals={recipeRows(recipes, foods)} />
      <div className="k-nav k-stick">
        <NavBar active="library" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
