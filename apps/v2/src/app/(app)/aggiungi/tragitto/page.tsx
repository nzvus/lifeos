/**
 * ⊕ → «Tragitto» (dossiers/movement.md, slice 1): the person's routes, the
 * most used first; one tap logs it now with its usual minutes (editable on
 * its entry afterwards). «Nuovo tragitto» adds one to the library.
 */
import { Box, F, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { addDays } from "@/core/engines/time";
import { readRoutes } from "@/core/movement/routes";
import { MODE_WORDS } from "@/features/movement-words";
import { addContext } from "../kinds";
import { logTripNow } from "./actions";

export default async function TripPage({
  searchParams,
}: {
  searchParams: Promise<{ giorno?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { day, today } = await addContext(db, owner, (await searchParams).giorno);
  const routes = await readRoutes(db, owner, addDays(today, -90));
  return (
    <main className="k-page">
      <PageHeader
        title="Tragitto"
        context={day === today ? "adesso" : F.Day(day)}
        back={{ label: "Aggiungi", href: "/aggiungi?giorno=" + day }}
        of={{ fam: "train", kind: "trip" }}
      />
      <section className="k-section g2" aria-label="I tuoi tragitti">
        {routes.length === 0 ? (
          <p className="k-help">
            Ancora nessun tragitto: aggiungi quelli che fai spesso (casa → palestra, casa
            → lavoro) e poi basta un tocco.
          </p>
        ) : (
          routes.map((r) => (
            <form key={r.id} action={logTripNow.bind(null, r.id, day)}>
              <button type="submit" className="k-pick">
                <Box
                  density="row"
                  rail={false}
                  entry={{
                    fam: "train",
                    of: { kind: "trip" },
                    title: r.name,
                    value: "+",
                    meta: [
                      MODE_WORDS[r.mode] ?? r.mode,
                      r.distanceKm !== null ? F.num(r.distanceKm, "km") : "",
                      r.durationMin !== null ? F.hm(r.durationMin) : "",
                      r.uses ? F.plural(r.uses, "volta", "volte") + " in 90 giorni" : "",
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  }}
                />
              </button>
            </form>
          ))
        )}
        <a
          className="k-link"
          href={
            "/libreria/tragitto/nuovo?torna=" +
            encodeURIComponent("/aggiungi/tragitto?giorno=" + day)
          }
        >
          + Nuovo tragitto
        </a>
      </section>
    </main>
  );
}
