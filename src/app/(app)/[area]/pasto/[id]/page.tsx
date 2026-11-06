/**
 * A saved meal's page (V-07, first part): its foods, its totals per serving.
 * A saved estimate shows its typed totals. Both are logged, changed in the
 * composer, started from («Parti da…») or archived (FOOD-42).
 */
import { notFound } from "next/navigation";
import { Box, F, List, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
import { FOOD_FIELDS, mealPage } from "@/features/library/library";
import { archiveSaved } from "./modifica/actions";

export default async function SavedMealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { id } = await params;
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const foods = await readFoodChoices(db, owner, today);
  const page = mealPage(foods, await readRecipeChoices(db, owner, today, foods), id);
  if (!page) notFound();
  return (
    <main className="k-page">
      <PageHeader
        title={page.name}
        context={"mangiato " + F.plural(page.uses, "volta", "volte")}
        back={{ label: "Pasti salvati", href: "/cibo/elenco?vista=pasti" }}
        of={{ fam: "food", kind: "meal" }}
      />
      <div className="k-section">
        <div className="k-line g2 wrap">
          <a className="k-btn primary" href={"/aggiungi/pasto?pasto=" + id}>
            Registra
          </a>
          <a className="k-btn secondary" href={"/cibo/pasto/" + id + "/modifica"}>
            Modifica
          </a>
          {/* «Parti da…» (FOOD-33, FOOD-42): a new meal starting from this one, never «Duplica». */}
          {/* A variant keeps following this meal; «Parti da» is a copy on its own (ADR-0060). */}
          {!page.estimate && (
            <a className="k-btn secondary" href={"/cibo/pasto/nuovo?variante=" + id}>
              + Variante
            </a>
          )}
          <a className="k-btn secondary" href={"/cibo/pasto/nuovo?da=" + id}>
            Parti da questo
          </a>
          <form action={archiveSaved.bind(null, id)}>
            <button type="submit" className="k-btn secondary">
              Archivia
            </button>
          </form>
        </div>
      </div>
      {(page.base || page.variants.length > 0) && (
        <section className="k-section g2" aria-label="Famiglia">
          <h2>Famiglia</h2>
          {page.base && (
            <Box
              density="row"
              rail={false}
              entry={{
                fam: "food",
                of: { kind: "meal" },
                title: "variante di " + page.base.name,
                meta: page.base.changes.join(" · ") || "uguale alla base",
                href: "/cibo/pasto/" + page.base.id,
              }}
            />
          )}
          {page.variants.length > 0 && (
            <List label="Le sue varianti">
              {page.variants.map((v) => (
                <Box
                  key={v.id}
                  density="row"
                  rail={false}
                  entry={{
                    fam: "food",
                    of: { kind: "meal" },
                    title: v.name,
                    meta:
                      "variante · " +
                      F.plural(v.uses, "volta", "volte") +
                      " in 90 giorni",
                    href: "/cibo/pasto/" + v.id,
                  }}
                />
              ))}
            </List>
          )}
          {page.variants.length > 0 && (
            <p className="k-help">
              Cambiando questo pasto cambiano anche le varianti, tranne quello che ognuna
              cambia; i pasti già registrati restano come erano.
            </p>
          )}
        </section>
      )}
      {page.estimate ? (
        <section className="k-section">
          <p className="k-help">
            Una stima a mano: registrandolo conta come stima, con questi totali.
          </p>
        </section>
      ) : (
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
      )}
      <section className="k-section g3" aria-label="Totali">
        <h2>{page.estimate ? "Il pasto" : "Una porzione"}</h2>
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
