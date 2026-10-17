/**
 * ⊕ Aggiungi (V-02), first part: «Cosa», the meal composer and the kinds
 * this person can enter, each opening its sheet for the day it came from. Search, "usual at
 * this hour", recent entries and the meal composer come with their slices.
 */
import { Box, F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { kindRows } from "@/features/day/entry-form";
import { addContext } from "./kinds";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ giorno?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const { kinds, day, today } = await addContext(
    await getDb(),
    owner,
    (await searchParams).giorno,
  );
  const back = day === today ? "/oggi" : "/oggi/" + day;
  const rows = kindRows(kinds, (k) => `/aggiungi/${k}?giorno=${day}`);
  return (
    <div className="k-sheet-wrap k-screen">
      <a className="k-dim" href={back} aria-label="Chiudi" />
      <section className="k-sheet" role="dialog" aria-label="Aggiungi">
        <span className="handle" />
        <div className="k-sh">
          <h2>Aggiungi</h2>
          <span className="k-meta">{day === today ? "oggi" : F.Day(day)}</span>
        </div>
        <div className="k-sbody">
          <section className="k-section" aria-label="Cosa aggiungere">
            <h2>Cosa</h2>
            <div className="k-grid">
              <a href={`/aggiungi/pasto?giorno=${day}`} className="k-plain">
                <Box
                  entry={{ fam: "food", of: { kind: "meal" }, title: "Pasto" }}
                  density="row"
                  rail={false}
                />
              </a>
              {rows.map((r) => (
                <a key={r.key} href={r.href} className="k-plain">
                  <Box entry={r.entry} density="row" rail={false} />
                </a>
              ))}
            </div>
            <p className="k-help">
              Allenamenti e spese hanno i loro editor: arrivano con le prossime parti.
            </p>
          </section>
        </div>
        <div className="foot">
          <a className="k-btn secondary k-grow" href={back}>
            Chiudi
          </a>
        </div>
      </section>
    </div>
  );
}
