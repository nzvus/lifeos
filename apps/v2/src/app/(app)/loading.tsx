/**
 * While a page of the app loads (register S18: every load its skeleton): the
 * page's own shape — title, a panel, a few rows — in the kit's `k-skel`, so the
 * old page does not sit frozen on a phone while the new one comes.
 */
export default function Loading() {
  return (
    <main className="k-page" aria-busy="true" aria-label="Carico la pagina">
      <section className="k-section g3">
        <span className="k-skel title" />
        <span className="k-skel card" />
        <span className="k-skel row" />
        <span className="k-skel row" />
        <span className="k-skel row" />
      </section>
    </main>
  );
}
