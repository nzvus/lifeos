/** Piano (flows.md §1): one of the four places; its screens come with their slices. */
import { NavBar, PageHeader } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { PLACES } from "@/features/places";

export default async function PianoPage() {
  await requireOwner();
  return (
    <main className="k-page has-bd">
      <PageHeader title="Piano" of={{ place: "piano" }} />
      <section className="k-section g3" aria-label="Piano">
        <p className="k-empty k-meta">
          Qui arriverà il piano della settimana: modelli, cicli e abitudini. Per ora la
          nuova versione ha Oggi, ⊕ e la palestra.
        </p>
      </section>
      <div className="k-nav k-stick">
        <NavBar active="plan" hrefs={PLACES} addHref="/aggiungi" />
      </div>
    </main>
  );
}
