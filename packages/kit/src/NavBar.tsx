/**
 * NavBar (ADR-0059, map D) — the five places, Oggi in the middle, the current
 * one with the tick; ⊕ floats bottom right above the bar, the same on every
 * page, and adds to the place you are on (architecture.md §10). Hrefs are the
 * app's, passed in once.
 */
import { Glyph } from "./Glyph";
import type { GlyphOf } from "./glyph";

export type Area = "corpo" | "cibo" | "oggi" | "mente" | "soldi";

/** The bar's order and words (ADR-0059); the drawings are their domains' (decided by the agent, 31 Oct). */
export const AREAS: [Area, string, GlyphOf][] = [
  ["corpo", "Corpo", { fam: "train" }],
  ["cibo", "Cibo", { fam: "food" }],
  ["oggi", "Oggi", { place: "oggi" }],
  ["mente", "Mente", { fam: "mind" }],
  ["soldi", "Soldi", { fam: "money" }],
];

export function NavBar({
  active,
  hrefs,
  addHref,
}: {
  active: Area;
  hrefs: Record<Area, string>;
  addHref: string;
}) {
  return (
    <>
      <a className="k-add k-fab" href={addHref} aria-label="Aggiungi">
        <Glyph of={{ ui: "add" }} size="l" />
      </a>
      <nav className="k-navbar" aria-label="Navigazione principale">
        {AREAS.map(([key, name, of]) => (
          <a
            key={key}
            className="k-place"
            href={hrefs[key]}
            aria-current={key === active ? "page" : undefined}
          >
            <Glyph of={of} size="m" />
            {name}
            <span className="tick" />
          </a>
        ))}
      </nav>
    </>
  );
}

export type Tab = "diario" | "piano" | "elenco" | "andamento";

/** The four tabs, the same in every place and in the same order (ADR-0059). */
export const TABS: [Tab, string][] = [
  ["diario", "Diario"],
  ["piano", "Piano"],
  ["elenco", "Elenco"],
  ["andamento", "Andamento"],
];

export function AreaTabs({ tab, hrefs }: { tab: Tab; hrefs: Record<Tab, string> }) {
  return (
    <nav className="k-tabs k-areatabs" aria-label="Schede">
      {TABS.map(([key, name]) => (
        <a
          key={key}
          className="k-tab"
          href={hrefs[key]}
          aria-current={key === tab ? "page" : undefined}
        >
          {name}
        </a>
      ))}
    </nav>
  );
}
