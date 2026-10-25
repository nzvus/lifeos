/**
 * «Tracker e tipi» (V-14; the board Settings): the person's own trackers,
 * each with its drawing, how many fields, «Archivia» (out of ⊕, its entries
 * kept) or «Riattiva»; then «Nuovo tracker». A tracker made here is entered
 * from ⊕ and shown on Oggi like a built-in (core/kinds).
 */
import { Box, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { listUserKinds } from "@/core/kinds/user";
import { TrackerForm } from "@/features/account/TrackerForm";
import { archiveTracker, createTracker } from "./actions";

export default async function TrackersPage({
  searchParams,
}: {
  searchParams: Promise<{ fatto?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const mine = await listUserKinds(await getDb(), owner);
  const { fatto } = await searchParams;
  const made = mine.find((k) => k.key === fatto);
  return (
    <main className="k-page">
      <PageHeader
        title="Tracker e tipi"
        context="quelli di base, più i tuoi"
        back={{ label: "Impostazioni", href: "/impostazioni" }}
        of={{ fam: "settings", kind: "trackers" }}
      />
      {made && (
        <section className="k-section">
          <p className="k-help" role="status">
            «{made.name}» è pronto: lo trovi in ⊕ → Cosa.{" "}
            <a className="k-link" href={"/aggiungi/" + made.key}>
              Segnalo adesso ›
            </a>
          </p>
        </section>
      )}
      <section className="k-section g2" aria-label="I tuoi tracker">
        <h2>I tuoi tracker</h2>
        {mine.length === 0 ? (
          <p className="k-help">Ancora nessuno: crea il primo qui sotto.</p>
        ) : (
          mine.map((k) => (
            <form key={k.id} action={archiveTracker.bind(null, k.id, !k.archived)}>
              <Box
                density="row"
                rail={false}
                entry={{
                  fam: k.family,
                  of: { kind: k.key },
                  title: k.name,
                  faded: k.archived,
                  href: "/andamento/" + k.key,
                  hrefLabel: "Andamento di " + k.name,
                  meta:
                    (k.shape === "interval" ? "con una durata" : "un momento") +
                    " · " +
                    (k.fields === 0
                      ? "un segno"
                      : k.fields + (k.fields === 1 ? " campo" : " campi")) +
                    (k.archived ? " · archiviato" : ""),
                }}
              />
              <button type="submit" className="k-btn link">
                {k.archived ? "Riattiva" : "Archivia"}
              </button>
            </form>
          ))
        )}
      </section>
      <section className="k-section g3" aria-label="Nuovo tracker" id="nuovo">
        <h2>Nuovo tracker</h2>
        <TrackerForm action={createTracker} />
      </section>
    </main>
  );
}
