/** A food's page (V-07, first part): values per 100, its products, the saved meals that use it. Editing comes with the editor. */
import { notFound } from "next/navigation";
import { F, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readClock } from "@/core/day";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
import { FOOD_FIELDS, foodPage } from "@/features/library/library";

export default async function FoodPage({ params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  const today = logicalDay(new Date(), (await readClock(db, owner)).clock);
  const foods = await readFoodChoices(db, owner, today);
  const page = foodPage(foods, await readRecipeChoices(db, owner, today, foods), id);
  if (!page) notFound();
  return (
    <main className="k-page">
      <PageHeader
        title={page.name}
        back={{ label: "Libreria", href: "/libreria" }}
        of={{ fam: "food" }}
      />
      <section className="k-section g3" aria-label="Valori">
        <h2>Per 100 {page.unit}</h2>
        {FOOD_FIELDS.filter(([f]) => page.per100[f] !== undefined).map(
          ([f, words, unit]) => (
            <div key={f} className="k-line between">
              <span className="k-body">{words}</span>
              <span className="k-num">{F.num(Number(page.per100[f]), unit)}</span>
            </div>
          ),
        )}
      </section>
      {page.products.length > 0 && (
        <section className="k-section g3" aria-label="Prodotti">
          <h2>Prodotti</h2>
          {page.products.map((p, i) => (
            <div key={i} className="k-line between">
              <span className="k-body">{p.brand}</span>
              <span className="k-meta">{F.plural(p.uses, "volta", "volte")}</span>
            </div>
          ))}
        </section>
      )}
      <section className="k-section g3" aria-label="Pasti salvati">
        <h2>Nei pasti salvati</h2>
        {page.meals.length === 0 && <p className="k-help">In nessun pasto salvato.</p>}
        {page.meals.map((m, i) => (
          <div key={i} className="k-line between">
            <span className="k-body">{m.name}</span>
            <span className="k-num">{F.num(Number(m.quantity), page.unit)}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
