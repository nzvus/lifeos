/** A saved meal's page (V-07, first part): its foods, its totals per serving. Editing comes with the meal editor. */
import { notFound } from "next/navigation";
import { F, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readClock } from "@/core/day";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
import { FOOD_FIELDS, mealPage } from "@/features/library/library";

export default async function SavedMealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  const today = logicalDay(new Date(), (await readClock(db, owner)).clock);
  const foods = await readFoodChoices(db, owner, today);
  const page = mealPage(foods, await readRecipeChoices(db, owner, today, foods), id);
  if (!page) notFound();
  return (
    <main className="k-page">
      <PageHeader
        title={page.name}
        context={"mangiato " + F.plural(page.uses, "volta", "volte")}
        back={{ label: "Libreria", href: "/libreria" }}
        of={{ fam: "food", kind: "meal" }}
      />
      <div className="k-section">
        <div className="k-line g2">
          <a className="k-btn primary" href={"/aggiungi/pasto?pasto=" + id}>
            Registra
          </a>
          <a className="k-btn secondary" href={"/libreria/pasto/" + id + "/modifica"}>
            Modifica
          </a>
        </div>
      </div>
      <section className="k-section g3" aria-label="Cibi">
        <h2>Cibi</h2>
        {page.parts.map((p, i) => (
          <div key={i} className="k-line between">
            <span className="k-body">
              {p.href ? (
                <a className="k-link" href={p.href}>
                  {p.name}
                </a>
              ) : (
                p.name
              )}
              {p.brand && <span className="k-meta"> · {p.brand}</span>}
            </span>
            <span className="k-num">{F.num(Number(p.quantity), p.unit)}</span>
          </div>
        ))}
      </section>
      <section className="k-section g3" aria-label="Totali">
        <h2>Una porzione</h2>
        {FOOD_FIELDS.filter(([f]) => f !== "nova" && page.totals[f] !== undefined).map(
          ([f, words, unit]) => (
            <div key={f} className="k-line between">
              <span className="k-body">{words}</span>
              <span className="k-num">{F.num(page.totals[f]!, unit)}</span>
            </div>
          ),
        )}
      </section>
    </main>
  );
}
