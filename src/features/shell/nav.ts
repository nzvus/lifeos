/**
 * Which NavBar and ⊕ the one `(app)/layout.tsx` shows for an address (PAT-01). Pure.
 *
 * Every signed-in page has the bar (his answer to Q-09, 6 Nov: «a»); a running gym session
 * never has it (TRAIN-10, his pick 6 Nov). ⊕ hides by itself while a sticky «Salva» is on the
 * page (kit.css), so it never covers it.
 */
import type { Area } from "@lifeos/kit";

const AREAS: readonly Area[] = ["oggi", "corpo", "cibo", "mente", "soldi"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isArea = (s: string | null): s is Area =>
  !!s && (AREAS as readonly string[]).includes(s);

export type Nav = { active: Area | null; addHref: string };

export function navFor(pathname: string, search: URLSearchParams): Nav | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const [, first = "", second = "", third = ""] = path.split("/");
  if (isArea(first) && second === "sessione" && third) return null;
  // The area of the page: its first segment; ⊕ says it in `?area=`; the gym is Corpo's.
  const named = first === "aggiungi" ? search.get("area") : first;
  const area = isArea(named) ? named : first === "palestra" ? "corpo" : null;
  const active = area;
  const q = new URLSearchParams();
  if (isArea(first) && DATE.test(second)) q.set("giorno", second);
  if (area && area !== "oggi") q.set("area", area);
  const qs = q.toString();
  return { active, addHref: "/aggiungi" + (qs ? "?" + qs : "") };
}
