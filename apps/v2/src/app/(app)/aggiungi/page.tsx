/**
 * ⊕ Aggiungi (V-02), first part: «Cosa», the meal composer and the kinds
 * this person can enter, each opening its sheet for the day it came from;
 * «Di nuovo»: the last meals, each opening the composer with its foods.
 * Search and "usual at this hour" come with their slices.
 */
import { Box, F } from "@lifeos/kit";
import { requireOwner } from "@/app/_server/owner";
import { getDb } from "@/app/_server/runtime";
import { loadDays } from "@/core/day";
import { addDays } from "@/core/engines/time";
import { kindRows } from "@/features/day/entry-form";
import { present } from "@/features/day/present";
import { addContext } from "./kinds";

/** How many recent meals ⊕ offers to register again, from the last three days. */
const RECENT = 4;

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ giorno?: string | string[] }>;
}) {
  const owner = await requireOwner();
  const db = await getDb();
  const { kinds, day, today, clock, roleBounds } = await addContext(
    db,
    owner,
    (await searchParams).giorno,
  );
  // The last three days, newest first, from one set of queries.
  const recent = (
    await loadDays(db, owner, addDays(today, -2), today, { clock, roleBounds })
  )
    .reverse()
    .flatMap((d) =>
      [...d.timed]
        .reverse()
        .concat(d.untimed)
        .filter(
          (i) => i.kind.key === "meal" && i.status === "done" && i.lines.length > 0,
        ),
    )
    .slice(0, RECENT);
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
          {recent.length > 0 && (
            <section className="k-section" aria-label="Pasti recenti">
              <h2>Di nuovo</h2>
              <div className="k-stack g2">
                {recent.map((i) => {
                  // The row opens the composer; the timeline's own link would nest.
                  const { href: _href, hrefLabel: _label, ...entry } = present(i);
                  return (
                    <a
                      key={i.id}
                      href={`/aggiungi/pasto?giorno=${day}&da=${i.id}`}
                      className="k-plain"
                    >
                      <Box entry={{ ...entry, value: "+" }} density="row" rail={false} />
                    </a>
                  );
                })}
              </div>
            </section>
          )}
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
              <a href="/palestra" className="k-plain">
                <Box
                  entry={{ fam: "train", of: { kind: "session" }, title: "Allenamento" }}
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
              Le spese hanno il loro editor: arriva con la prossima parte.
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
