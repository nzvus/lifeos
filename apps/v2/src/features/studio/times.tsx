/**
 * Visual study, choice «gli orari» (dossiers/visual.md §3.1, ledger UI-74,
 * CONTRA-02): the day's rows on the developer's 29 October, as v2 draws them
 * today (the thin coloured rail with the time written vertically, the
 * developer's request, already built), beside three rethought ways to place
 * the time. Local study only.
 */
import { Box, F, type BoxEntry } from "@lifeos/kit";
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import { loadDays, readClock, type DayItem } from "@/core/day";
import { present } from "@/features/day/present";

const DAY = "2026-10-29";
type Known = Awaited<ReturnType<typeof readClock>>;

const PARTS = [
  { name: "Notte e mattina", to: 12 * 60 },
  { name: "Pomeriggio", to: 18 * 60 },
  { name: "Sera", to: 48 * 60 },
];

export async function TimesStudio({
  db,
  owner,
  known,
}: {
  db: Db;
  owner: Owner;
  known: Known;
}) {
  const [d] = await loadDays(db, owner, DAY, DAY, known);
  if (!d) return null;
  const rows = d.timed
    .filter((i) => i.kind.key !== "water" && i.minute !== null)
    .map((i: DayItem) => ({
      i,
      at: i.minute!,
      e: { ...present(i), time: F.time(i.minute!) } as BoxEntry,
    }));
  const withTime = (r: (typeof rows)[number]): BoxEntry => ({
    ...r.e,
    meta: F.time(r.at) + (r.e.meta ? " · " + r.e.meta : ""),
  });
  return (
    <main className="k-page">
      <section className="k-section g2" aria-label="Com’è oggi">
        <h2>Scelta · gli orari — la tua giornata del 29 ottobre</h2>
        <p className="k-help">
          Com’è oggi in v2: la colonna sottile e colorata con l’ora in verticale, quella
          che avevi chiesto. Tocca la colonna e gli orari si allargano.
        </p>
        <div className="k-stack g2">
          {rows.map((r) => (
            <Box key={r.i.id} entry={r.e} />
          ))}
        </div>
      </section>

      <section className="k-section g2" aria-label="1 · L’ora dentro">
        <h2>1 · L’ora dentro il riquadro</h2>
        <p className="k-help">
          Nessuna colonna: l’ora apre la riga sotto il titolo. Tutta la larghezza ai
          riquadri, l’ora dove si legge già il resto.
        </p>
        <div className="k-stack g2">
          {rows.map((r) => (
            <Box key={r.i.id} entry={withTime(r)} rail={false} />
          ))}
        </div>
      </section>

      <section className="k-section g2" aria-label="2 · Il tempo vuoto">
        <h2>2 · Il tempo vuoto si vede</h2>
        <p className="k-help">
          L’ora dentro, e tra un riquadro e l’altro lo spazio che è passato: le ore senza
          niente si vedono, e si dicono.
        </p>
        <div className="k-stack g1">
          {rows.map((r, k) => {
            const gap = k > 0 ? r.at - rows[k - 1]!.at : 0;
            return (
              <div key={r.i.id} className="k-stack g1">
                {gap >= 120 && (
                  <span
                    className="k-meta"
                    style={{ height: Math.min(96, Math.round(gap / 6)) + "px" }}
                  >
                    {F.hm(gap)} senza niente
                  </span>
                )}
                <Box entry={withTime(r)} rail={false} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="k-section g2" aria-label="3 · Per parte del giorno">
        <h2>3 · Per parte del giorno</h2>
        <p className="k-help">
          Mattina, pomeriggio, sera come piccoli titoli; dentro, l’ora nella riga. Si
          cerca «la sera» prima di «le 20:30».
        </p>
        {PARTS.map((p, k) => {
          const from = k === 0 ? -Infinity : PARTS[k - 1]!.to;
          const mine = rows.filter((r) => r.at >= from && r.at < p.to);
          return mine.length === 0 ? null : (
            <div key={p.name} className="k-stack g2">
              <span className="k-label b2">{p.name}</span>
              {mine.map((r) => (
                <Box key={r.i.id} entry={withTime(r)} rail={false} />
              ))}
            </div>
          );
        })}
      </section>
    </main>
  );
}
