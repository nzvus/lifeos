/**
 * Visual study, choice «il pannello» (dossiers/visual.md §3.1, ledger UI-74,
 * CONTRA-01): how a page groups its things, on the developer's 29 October
 * grouped by area (ADR-0059: Cibo, Corpo, Sonno). Today v2 titles a section
 * with a coloured tick and a rule, and every thing is a framed card. Three
 * rethought ways beside it. Local study only.
 */
import type { CSSProperties, ReactNode } from "react";
import { Box, type BoxEntry } from "@lifeos/kit";
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import { loadDays, readClock } from "@/core/day";
import { present } from "@/features/day/present";

const DAY = "2026-10-29";
type Known = Awaited<ReturnType<typeof readClock>>;
const AREAS = [
  { name: "Cibo", fam: "food", kinds: ["meal", "intake"] },
  { name: "Corpo", fam: "train", kinds: ["session", "weigh_in", "steps", "activity"] },
  { name: "Sonno", fam: "sleep", kinds: ["sleep", "nap"] },
];

export async function PanelStudio({
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
  const all = [...d.timed, ...d.untimed];
  const groups = AREAS.map((a) => ({
    ...a,
    rows: all
      .filter((i) => a.kinds.includes(i.kind.key) && i.status === "done")
      .slice(0, 3)
      .map((i) => ({ id: i.id, e: present(i) as BoxEntry })),
  })).filter((g) => g.rows.length > 0);
  const option = (title: string, why: string, body: ReactNode) => (
    <section className="k-section g2" aria-label={title}>
      <h2>{title}</h2>
      <p className="k-help">{why}</p>
      {body}
    </section>
  );
  return (
    <main className="k-page">
      {option(
        "Scelta · il pannello — com’è oggi",
        "Le schede di Oggi, qui raggruppate per area: in v2 ogni cosa è una scheda incorniciata del suo colore e con la sua sagoma, e le sezioni hanno la tacca colorata e il filo.",
        groups.map((g) => (
          <div key={g.name} className="k-stack g2">
            <span className="k-label b2">{g.name}</span>
            {g.rows.map((r) => (
              <Box key={r.id} entry={r.e} rail={false} />
            ))}
          </div>
        )),
      )}
      {option(
        "1 · Lo spazio separa",
        "Niente cornici né fili tra i gruppi: un titolo piccolo, le cose in righe compatte, l’aria tra un gruppo e l’altro. Qui le righe tengono ancora la cornice del Box: senza cornice davvero serve una riga semplice nel kit, da fare se scegli questa.",
        groups.map((g) => (
          <div key={g.name} className="k-stack g1" style={{ marginTop: "12px" }}>
            <span className="k-meta">{g.name.toUpperCase()}</span>
            {g.rows.map((r) => (
              <Box key={r.id} entry={r.e} density="row" rail={false} />
            ))}
          </div>
        )),
      )}
      {option(
        "2 · Un pannello per area",
        "Come v1, che si capiva: un pannello per area, il titolo dentro, le cose in righe. Si vede subito cosa sta insieme.",
        groups.map((g) => (
          <div key={g.name} className="k-panel k-stack g2">
            <span className="k-label b2">{g.name}</span>
            {g.rows.map((r) => (
              <Box key={r.id} entry={r.e} density="row" rail={false} />
            ))}
          </div>
        )),
      )}
      {option(
        "3 · Il colore separa",
        "Ogni area su un fondo appena tinto del suo colore, senza cornice: il colore dice l’area anche con la coda dell’occhio.",
        groups.map((g) => (
          <div
            key={g.name}
            className={"fam-" + g.fam + " k-stack g2"}
            style={
              {
                padding: "12px",
                borderRadius: "var(--radius-surface)",
                background: "color-mix(in srgb, var(--fam) 10%, var(--paper))",
              } as CSSProperties
            }
          >
            <span className="k-label b2" style={{ color: "var(--fam)" }}>
              {g.name}
            </span>
            {g.rows.map((r) => (
              <Box key={r.id} entry={r.e} density="row" rail={false} />
            ))}
          </div>
        )),
      )}
    </main>
  );
}
