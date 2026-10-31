/**
 * Libreria → «Dispensa» (dossiers/pantry.md §6, V-12): «Da comprare» on
 * top (what runs out before the next shop), then «In casa», those running
 * out first. Each food opens its page, where «Comprato» and «Ne ho…» are.
 * What is eaten comes out by itself, from the meals already logged.
 */
import { Box, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { logicalDay } from "@/core/engines/time";
import { readPantry, SHOP_EVERY_DAYS, type PantryFood } from "@/core/pantry";
import { stockWords } from "@/features/library/pantry";
import { AREA_HREF } from "@/features/places";

export default async function PantryPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const now = new Date();
  const foods = await readPantry(db, owner, logicalDay(now, clock), now);
  const buy = foods.filter((f) => f.toBuy);
  const home = foods.filter((f) => !f.toBuy);
  const row = (f: PantryFood) => (
    <Box
      key={f.foodId}
      density="row"
      rail={false}
      entry={{
        fam: "food",
        of: { kind: "ingredient" },
        title: f.name,
        ...stockWords(f.stock, f.unit),
        href: "/libreria/cibo/" + f.foodId + "#dispensa",
        hrefLabel: "Apri " + f.name,
      }}
    />
  );
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Dispensa"
        context={"cosa hai in casa · spesa ogni " + SHOP_EVERY_DAYS + " giorni"}
        back={{ label: "Libreria", href: "/oggi/elenco" }}
        of={{ place: "libreria" }}
      />
      {foods.length === 0 ? (
        <section className="k-section g2" aria-label="Dispensa vuota">
          <p className="k-help">
            Segna cosa compri e la dispensa si tiene da sola: quello che mangi lo toglie
            lei. Apri un cibo in Libreria → Cibi e premi «Comprato».
          </p>
        </section>
      ) : (
        <>
          <section className="k-section g2" aria-label="Da comprare">
            <h2>Da comprare</h2>
            {buy.length === 0 ? (
              <p className="k-help">Niente finisce prima della prossima spesa.</p>
            ) : (
              buy.map(row)
            )}
          </section>
          {home.length > 0 && (
            <section className="k-section g2" aria-label="In casa">
              <h2>In casa</h2>
              {home.map(row)}
            </section>
          )}
        </>
      )}
      <div className="k-nav k-stick">
        <NavBar active="oggi" hrefs={AREA_HREF} addHref="/aggiungi" />
      </div>
    </main>
  );
}
