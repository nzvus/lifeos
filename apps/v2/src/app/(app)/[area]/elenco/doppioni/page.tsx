/**
 * «Possibili doppioni» (ADR-0060 slice f, dossiers/objects.md §6; his pick 3
 * Nov: the agent proposes each, he ticks): foods that are a brand of another
 * or the same thing twice, saved meals that are a variant of another. Every
 * answer keeps what was logged (ADR-0007); «Sono diversi» is remembered.
 */
import { notFound } from "next/navigation";
import { NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { readNotTwins } from "@/core/account/not-twins";
import { logicalDay } from "@/core/engines/time";
import { readFoodChoices, readRecipeChoices } from "@/core/food/catalog";
import { AREA_HREF } from "@/features/places";
import { twinPairs } from "@/features/library/twins";
import { asBrand, asOne, asVariant, notTwins } from "./actions";

export default async function TwinsPage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  if ((await params).area !== "cibo") notFound();
  const owner = await requireOwner();
  const db = await getDb();
  const today = logicalDay(new Date(), (await ownerClock()).clock);
  const foods = await readFoodChoices(db, owner, today);
  const pairs = twinPairs(
    foods,
    await readRecipeChoices(db, owner, today, foods),
    await readNotTwins(db, owner),
  );
  return (
    <main className="k-page">
      <PageHeader
        title="Possibili doppioni"
        context={pairs.length === 0 ? "nessuno" : pairs.length + " da guardare"}
        back={{ label: "Cibo · Elenco", href: "/cibo/elenco" }}
        of={{ fam: "food" }}
      />
      <section className="k-section g3" aria-label="Doppioni">
        <p className="k-help">
          Per ognuno la proposta è il primo pulsante. I pasti già registrati restano come
          sono: cambia solo da dove li prendi d’ora in poi.
        </p>
        {pairs.length === 0 && <p className="k-empty k-meta">Niente da sistemare.</p>}
        {pairs.map((t) =>
          t.kind === "food" ? (
            <div key={t.a.id + t.b.id} className="k-box k-stack g2">
              <span className="k-label">
                «{t.a.name}» e «{t.b.name}»
              </span>
              <form
                action={asBrand.bind(null, t.a.id, t.b.id)}
                className="k-line g2 wrap"
              >
                <input
                  className="k-text"
                  name="brand"
                  defaultValue={t.brand ?? ""}
                  placeholder="la marca"
                  aria-label={"Marca di «" + t.a.name + "»"}
                  style={{ flex: 1, minWidth: "8rem" }}
                />
                <button
                  type="submit"
                  className={"k-btn " + (t.propose === "brand" ? "primary" : "secondary")}
                >
                  È una marca di «{t.b.name}»
                </button>
              </form>
              <div className="k-line g2 wrap">
                <form action={asOne.bind(null, t.b.id, t.a.id)}>
                  <button
                    type="submit"
                    className={
                      "k-btn " + (t.propose === "merge" ? "primary" : "secondary")
                    }
                  >
                    Sono la stessa cosa: uniscili
                  </button>
                </form>
                <form action={notTwins.bind(null, t.a.id, t.b.id)}>
                  <button type="submit" className="k-btn link">
                    Sono diversi
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div key={t.base.id + t.child.id} className="k-box k-stack g2">
              <span className="k-label">
                «{t.child.name}» e «{t.base.name}»
              </span>
              <div className="k-line g2 wrap">
                <form action={asVariant.bind(null, t.child.id, t.base.id)}>
                  <button type="submit" className="k-btn primary">
                    Variante di «{t.base.name}»
                  </button>
                </form>
                <form action={asVariant.bind(null, t.base.id, t.child.id)}>
                  <button type="submit" className="k-btn secondary">
                    Il contrario
                  </button>
                </form>
                <form action={notTwins.bind(null, t.base.id, t.child.id)}>
                  <button type="submit" className="k-btn link">
                    Sono diversi
                  </button>
                </form>
              </div>
            </div>
          ),
        )}
      </section>
      <div className="k-nav k-stick">
        <NavBar active="cibo" hrefs={AREA_HREF} addHref="/aggiungi?area=cibo" />
      </div>
    </main>
  );
}
