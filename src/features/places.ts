/**
 * Map D (ADR-0059, architecture.md §10): five places, each with the same four
 * tabs at `/{place}`, `/{place}/piano`, `/{place}/elenco`, `/{place}/andamento`;
 * every kind belongs to one area by its domain. Plain data: server pages pass
 * it to the kit.
 */
import { PLACES, type Area, type Place } from "@lifeos/kit";

export const AREA_HREF: Record<Area, string> = {
  corpo: "/corpo",
  cibo: "/cibo",
  oggi: "/oggi",
  mente: "/mente",
  soldi: "/soldi",
};

/** The places that take the area as a filter (PAT-95): `/{area}/{place}`, «Tutto» under `/oggi`. */
export type FilteredPlace = "elenco" | "piano" | "andamento";

/** The area chips of a place: the same place for each area; `rest` keeps a day (`/2026-11-05`). */
export const areaHrefs = (
  place: FilteredPlace | "",
  rest = "",
): Record<Area, string> => ({
  oggi: "/oggi" + (place ? "/" + place : "") + rest,
  cibo: "/cibo" + (place ? "/" + place : "") + rest,
  corpo: "/corpo" + (place ? "/" + place : "") + rest,
  mente: "/mente" + (place ? "/" + place : "") + rest,
  soldi: "/soldi" + (place ? "/" + place : "") + rest,
});

/** The bar from a page of `area`: the chip stays when he changes place (PAT-95). */
export const placeHrefs = (area: Area): Record<Place, string> => ({
  elenco: AREA_HREF[area] + "/elenco",
  piano: AREA_HREF[area] + "/piano",
  oggi: "/oggi",
  andamento: AREA_HREF[area] + "/andamento",
  obiettivi: "/oggi/andamento/obiettivi",
});

/** A place's title and drawing, for its header (the bar's own words, `PLACES`). */
export const placeHead = (place: Place) => {
  const [, title, of] = PLACES.find(([k]) => k === place)!;
  return { title, of };
};

/** The four areas besides Oggi, for the dynamic `[area]` routes. */
export const AREAS_OF_DOMAINS = ["corpo", "cibo", "mente", "soldi"] as const;
export type DomainArea = (typeof AREAS_OF_DOMAINS)[number];
export const isDomainArea = (s: string): s is DomainArea =>
  (AREAS_OF_DOMAINS as readonly string[]).includes(s);

/** ADR-0059: training, weight, measures, sleep, steps → Corpo; food and water → Cibo; mind, work, home → Mente; money → Soldi. */
const AREA_OF_DOMAIN: Record<string, DomainArea> = {
  food: "cibo",
  training: "corpo",
  body: "corpo",
  sleep: "corpo",
  mind: "mente",
  work: "mente",
  home: "mente",
  money: "soldi",
};

/** A kind's area by its domain; one with an unknown domain shows only in Oggi. */
export const areaOf = (domain: string): DomainArea | null =>
  AREA_OF_DOMAIN[domain] ?? null;

export const AREA_NAME: Record<Area, string> = {
  corpo: "Corpo",
  cibo: "Cibo",
  oggi: "Oggi",
  mente: "Mente",
  soldi: "Soldi",
};

/** A drawing's family to its area, for rows that carry only that (a model's planned items). */
const AREA_OF_FAM: Record<string, DomainArea> = {
  food: "cibo",
  drink: "cibo",
  train: "corpo",
  body: "corpo",
  sleep: "corpo",
  mind: "mente",
  habit: "mente",
  money: "soldi",
};
export const areaOfFam = (fam: string): DomainArea | null => AREA_OF_FAM[fam] ?? null;

/** The built-in trackers' areas (architecture.md §10); a kind of the person's own goes by its domain. */
const TRACKER_AREA: Record<string, DomainArea> = {
  peso: "corpo",
  sonno: "corpo",
  passi: "corpo",
  acqua: "cibo",
};
/** Where a tracker lives: `/{area}/andamento/{tracker}`; a health kind of their own falls in Corpo. */
export const trackerArea = (tracker: string, domain?: string): DomainArea =>
  TRACKER_AREA[tracker] ?? (domain ? areaOf(domain) : null) ?? "corpo";
export const trackerHref = (tracker: string, domain?: string) =>
  "/" + trackerArea(tracker, domain) + "/andamento/" + tracker;
