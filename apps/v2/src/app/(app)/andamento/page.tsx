/** Andamento (flows.md §1): one of the four places; its screens come with their slices. */
import { NavBar, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { PLACES } from "@/features/places";

export default async function AndamentoPage() {
  await requireOwner();
  return (
    <main className="k-page has-bd">
      <PageHeader title="Andamento" of={{ place: "andamento" }} />
      <section className="k-section g3" aria-label="Andamento">
        <p className="k-empty k-meta">
          Qui arriveranno i trend, gli obiettivi, i voti e le correlazioni. Per ora la
          nuova versione ha Oggi, ⊕ e la palestra.
        </p>
      </section>
      <div className="k-nav k-stick">
        <NavBar active="progress" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
