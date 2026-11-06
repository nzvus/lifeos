/**
 * Which NavBar and ⊕ the one `(app)/layout.tsx` shows for an address (PAT-01). Pure.
 *
 * Phase 3 moves the bar out of the pages without changing what is seen: it shows on the
 * addresses that had it on 6 Nov (the area pages, their tabs, and the pages under them that
 * mounted it). Whether sub-pages (forms, object pages, ⊕'s sheets) get it too is his call
 * (inbox): there ⊕ would cover the sticky «Salva». A running gym session never has it
 * (TRAIN-10, his pick 6 Nov).
 */
import type { Area } from "@lifeos/kit";

const AREA = "(oggi|corpo|cibo|mente|soldi)";
const DATE = "\\d{4}-\\d{2}-\\d{2}";
const WITH_NAV = [
  new RegExp(`^/${AREA}(/${DATE})?$`),
  new RegExp(`^/${AREA}/(piano|elenco|andamento)$`),
  new RegExp(`^/${AREA}/elenco/doppioni$`),
  new RegExp(`^/${AREA}/andamento/[^/]+$`),
  new RegExp(`^/${AREA}/(abitudine|ciclo|giornata)/[^/]+$`),
  /^\/piano\/modelli$/,
];

export type Nav = { active: Area | null; addHref: string };

export function navFor(pathname: string, search: URLSearchParams): Nav | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (!WITH_NAV.some((r) => r.test(path))) return null;
  const [, first = "", second = ""] = path.split("/");
  const area = (first === "piano" ? search.get("area") : first) as Area | null;
  const known =
    area && ["oggi", "corpo", "cibo", "mente", "soldi"].includes(area) ? area : null;
  // /piano/modelli without an area is the plan of all: Oggi, as the page said on 6 Nov.
  const active = known ?? (first === "piano" ? "oggi" : null);
  const q = new URLSearchParams();
  if (new RegExp(`^${DATE}$`).test(second)) q.set("giorno", second);
  if (known && known !== "oggi") q.set("area", known);
  const qs = q.toString();
  return { active, addHref: "/aggiungi" + (qs ? "?" + qs : "") };
}
