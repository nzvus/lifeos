/** Libreria (flows.md §1): one of the four places; its screens come with their slices. */
import { NavBar, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { PLACES } from "@/features/places";

export default async function LibreriaPage() {
  await requireOwner();
  return (
    <main className="k-page has-bd">
      <PageHeader title="Libreria" of={{ place: "libreria" }} />
      <section className="k-section g3" aria-label="Libreria">
        <p className="k-empty k-meta">
          Qui arriveranno cibi, pasti salvati, esercizi e i tuoi tipi. Per ora la nuova
          versione ha Oggi, ⊕ e la palestra.
        </p>
      </section>
      <div className="k-nav k-stick">
        <NavBar active="library" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
