/**
 * NavBar (kit.md §3, ADR-0054) — the four places and ⊕ in the middle; the
 * current place has the tick. Hrefs are the app's, passed in once.
 */
import { Glyph } from "./Glyph";

export type Place = "today" | "plan" | "progress" | "library";
const PLACES: [Place, string, string][] = [
  ["today", "Oggi", "oggi"],
  ["plan", "Piano", "piano"],
  ["progress", "Andamento", "andamento"],
  ["library", "Libreria", "libreria"],
];

export function NavBar({
  active,
  hrefs,
  addHref,
}: {
  active: Place;
  hrefs: Record<Place, string>;
  addHref: string;
}) {
  const tab = ([key, name, place]: [Place, string, string]) => (
    <a
      key={key}
      className="k-place"
      href={hrefs[key]}
      aria-current={key === active ? "page" : undefined}
    >
      <Glyph of={{ place }} size="m" />
      {name}
      <span className="tick" />
    </a>
  );
  return (
    <nav className="k-navbar" aria-label="Navigazione principale">
      {PLACES.slice(0, 2).map(tab)}
      <a className="k-add" href={addHref} aria-label="Aggiungi">
        <Glyph of={{ ui: "add" }} size="l" />
      </a>
      {PLACES.slice(2).map(tab)}
    </nav>
  );
}
