/**
 * Libreria → «Tragitti» (dossiers/movement.md, slice 1): the person's
 * routes, the most used first, each with how, km, usual minutes, metres on
 * foot and its Maps link; «Nuovo tragitto» adds one. Logging a trip is ⊕.
 */
import { Box, F, NavBar, PageHeader } from "@lifeos/kit";
import { ownerClock } from "@/app/_server/clock";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays, logicalDay } from "@/core/engines/time";
import { readRoutes } from "@/core/movement/routes";
import { MODE_WORDS } from "@/features/movement-words";
import { AREA_HREF } from "@/features/places";

export default async function RoutesPage() {
  const owner = await requireOwner();
  const db = await getDb();
  const { clock } = await ownerClock();
  const today = logicalDay(new Date(), clock);
  const routes = await readRoutes(db, owner, addDays(today, -90));
  return (
    <main className="k-page has-bd">
      <PageHeader
        title="Tragitti"
        back={{ label: "Libreria", href: "/oggi/elenco" }}
        of={{ place: "libreria" }}
      />
      <section className="k-section g2" aria-label="I tuoi tragitti">
        {routes.length === 0 ? (
          <p className="k-help">
            Ancora nessun tragitto. Aggiungi quelli che fai spesso; poi da ⊕ → Tragitto
            basta un tocco.
          </p>
        ) : (
          routes.map((r) => (
            <Box
              key={r.id}
              density="row"
              rail={false}
              entry={{
                fam: "train",
                of: { kind: "trip" },
                title: r.name,
                value: r.distanceKm !== null ? F.num(r.distanceKm, "km") : "",
                meta: [
                  MODE_WORDS[r.mode] ?? r.mode,
                  r.durationMin !== null ? F.hm(r.durationMin) : "",
                  // On foot the whole way says nothing new; by transport, the metres walked.
                  r.walkingM !== null && r.mode !== "walk" && r.mode !== "run"
                    ? F.num(r.walkingM, "m") + " a piedi"
                    : "",
                  r.uses ? F.plural(r.uses, "volta", "volte") + " in 90 giorni" : "",
                ]
                  .filter(Boolean)
                  .join(" · "),
                ...(r.mapsUrl ? { href: r.mapsUrl, hrefLabel: "Apri in Maps" } : {}),
              }}
            />
          ))
        )}
        <a className="k-link" href="/libreria/tragitto/nuovo">
          + Nuovo tragitto
        </a>
      </section>
      <div className="k-nav k-stick">
        <NavBar active="oggi" hrefs={AREA_HREF} addHref="/aggiungi" />
      </div>
    </main>
  );
}
