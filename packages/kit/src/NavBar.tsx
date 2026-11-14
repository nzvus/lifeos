/**
 * NavBar (ADR-0063, PAT-01) — the five places by action, Oggi in the middle, the
 * current one with the tick: prepare on the left (Elenco, Piano), learn on the
 * right (Andamento, Obiettivi). ⊕ floats bottom right above the bar, the same on
 * every page. Hrefs are the app's, passed in once. The areas (`AREAS`) are no
 * longer places: an area is a filter (PAT-95).
 */
import type { ElementType } from "react";
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

export type Place = "elenco" | "piano" | "oggi" | "andamento" | "obiettivi";

/** The bar's order and words (ADR-0063; «yc», 13 Nov); each drawing is its place's or its type's. */
export const PLACES: [Place, string, GlyphOf][] = [
  ["elenco", "Elenco", { place: "libreria" }],
  ["piano", "Piano", { place: "piano" }],
  ["oggi", "Oggi", { place: "oggi" }],
  ["andamento", "Andamento", { place: "andamento" }],
  ["obiettivi", "Obiettivi", { fam: "goal" }],
];

export function NavBar({
  active,
  hrefs,
  addHref,
  link: AddLink = "a",
}: {
  /** Null on a page of no place (Profilo, the kit): no tick. */
  active: Place | null;
  hrefs: Record<Place, string>;
  addHref: string;
  /** The app's link for ⊕ (Next's `Link`), so Capture opens over the page he is on (PAT-60). */
  link?: ElementType;
}) {
  return (
    <>
      <AddLink className="k-add k-fab" href={addHref} aria-label="Aggiungi">
        <Glyph of={{ ui: "add" }} size="l" />
      </AddLink>
      <nav className="k-navbar" aria-label="Navigazione principale">
        {PLACES.map(([key, name, of]) => (
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
