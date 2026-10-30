/**
 * Visual study, choice «le icone» (dossiers/visual.md §3.1, ledger UI-74): the
 * Glyph as v2 draws it today (Tabler outline in a tile lightly tinted by its
 * domain), beside three rethought styles for the dark theme, each shown as in
 * a row: the icon before the word. Study-only CSS, the kit untouched.
 */
import { Glyph, type GlyphOf } from "@lifeos/kit";

const DOMAINS: { of: GlyphOf; word: string; fam: string }[] = [
  { of: { fam: "food", sub: "breakfast" }, word: "Colazione", fam: "food" },
  { of: { fam: "food", sub: "lunch" }, word: "Pranzo", fam: "food" },
  { of: { fam: "food", sub: "dinner" }, word: "Cena", fam: "food" },
  { of: { fam: "drink", sub: "water" }, word: "Acqua", fam: "drink" },
  { of: { fam: "train" }, word: "Allenamento", fam: "train" },
  { of: { fam: "sleep", sub: "wake" }, word: "Sonno", fam: "sleep" },
  { of: { fam: "body", sub: "weight" }, word: "Peso", fam: "body" },
  { of: { fam: "mind" }, word: "Come stai", fam: "mind" },
  { of: { fam: "money" }, word: "Spesa", fam: "money" },
];

const CSS = `
.st-fill .k-glyph.tile{background:var(--fam,var(--ink));box-shadow:none;color:var(--paper)}
.st-bold .k-glyph svg{stroke-width:2.25}
`;

const OPTIONS = [
  {
    cls: "",
    title: "Scelta · le icone — com’è oggi",
    why: "Il contorno di Tabler in una tessera appena tinta del colore del dominio, col filo interno.",
    size: "m" as const,
    tile: true,
  },
  {
    cls: "",
    title: "1 · Senza tessera",
    why: "L’icona nuda nel colore del dominio: più leggera, la riga respira; il colore fa da solo il lavoro della tessera.",
    size: "m" as const,
    tile: false,
  },
  {
    cls: "st-fill",
    title: "2 · Tessera piena",
    why: "Fondo pieno del colore del dominio e icona scura: al buio si riconosce prima, anche piccola.",
    size: "m" as const,
    tile: true,
  },
  {
    cls: "st-bold",
    title: "3 · Tratto più deciso",
    why: "Niente tessera, icona più grande e tratto più spesso: si legge meglio sullo scuro senza aggiungere superfici.",
    size: "l" as const,
    tile: false,
  },
];

export function IconsStudio() {
  return (
    <main className="k-page">
      <style>{CSS}</style>
      {OPTIONS.map((o) => (
        <section key={o.title} className="k-section g2" aria-label={o.title}>
          <h2>{o.title}</h2>
          <p className="k-help">{o.why}</p>
          <div className={"k-stack g2 " + o.cls}>
            {DOMAINS.map((d) => (
              <span key={d.word} className={"k-line g2 fam-" + d.fam}>
                <Glyph of={d.of} size={o.size} tile={o.tile} />
                <span className="k-body">{d.word}</span>
              </span>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
