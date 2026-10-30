/**
 * Visual study, choice «silhouette e sfondi» (dossiers/visual.md §3.1, ledger
 * UI-74, CONTRA-03): today every box has its domain's silhouette (masks in
 * kit.css) and a faint drawing behind its title (`.k-art`), which can sit
 * under the text. Three rethought ways, switched by context classes on the
 * same real boxes (study-only CSS below, the kit untouched). Local study only.
 */
import { Box, type BoxEntry } from "@lifeos/kit";
import type { Db } from "@/core/db/db";
import type { Owner } from "@/core/identity/owner";
import { loadDays, readClock } from "@/core/day";
import { present } from "@/features/day/present";

const DAY = "2026-10-29";
type Known = Awaited<ReturnType<typeof readClock>>;
const KINDS = ["sleep", "weigh_in", "meal", "intake", "session", "steps"];

/** Study-only overrides: no drawing; no silhouette; the drawing only when open. */
const CSS = `
.st-noart .k-artclip{display:none}
.st-plain .k-box{-webkit-mask:none!important;mask:none!important;clip-path:none!important;border-radius:var(--radius-surface)!important;padding-left:16px!important;padding-right:16px!important}
.st-plain .k-box.mind::after{display:none}
.st-openart .k-art.a1{opacity:0}
`;

export async function ShapesStudio({
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
  const rows = KINDS.flatMap((k) => {
    const i = all.find((x) => x.kind.key === k && x.status === "done");
    return i ? [{ id: i.id, e: present(i) as BoxEntry }] : [];
  });
  const options = [
    {
      cls: "",
      title: "Com’è oggi",
      why: "Ogni dominio la sua sagoma (l’etichetta del peso, le tacche dell’allenamento, la luna del sonno) e un disegno tenue dietro al titolo, che a volte passa sotto il testo.",
      dense: false,
    },
    {
      cls: "st-noart",
      title: "1 · La sagoma sì, il disegno no",
      why: "La forma dice il dominio; il disegno dietro al testo sparisce, e con lui il rumore sotto le parole.",
      dense: false,
    },
    {
      cls: "st-plain st-noart",
      title: "2 · L’icona al posto della sagoma",
      why: "Riquadri tutti uguali; il dominio lo dice una tessera con l’icona all’inizio della riga (icone prima delle parole). Più calmo, più uniforme.",
      dense: true,
    },
    {
      cls: "st-openart",
      title: "3 · Il disegno solo da aperto",
      why: "Chiuso il riquadro è pulito, con la sua sagoma; il disegno compare quando lo apri, dove c’è spazio per lui (come lo skyline, S19).",
      dense: false,
    },
  ];
  return (
    <main className="k-page">
      <style>{CSS}</style>
      {options.map((o) => (
        <section key={o.title} className="k-section g2" aria-label={o.title}>
          <h2>
            {o.title === "Com’è oggi"
              ? "Scelta · silhouette e sfondi — com’è oggi"
              : o.title}
          </h2>
          <p className="k-help">{o.why}</p>
          <div className={"k-stack g2 " + o.cls}>
            {rows.map((r) => (
              <Box
                key={r.id}
                entry={r.e}
                rail={false}
                density={o.dense ? "row" : "card"}
                // in 3 the meal is shown open: there the drawing appears
                {...(o.cls === "st-openart" &&
                r.e.fam === "food" &&
                r.e.sub === "breakfast"
                  ? { expanded: true }
                  : {})}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
