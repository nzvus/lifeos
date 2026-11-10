/**
 * Map D (ADR-0059, architecture.md §10): what each area's Elenco and Andamento
 * hold, as rows that lead to the pages; a tab that is a page of its own (Cibo and
 * Corpo's Elenco, Soldi's Andamento; every area's Piano: `[area]/piano`) has no rows here.
 * The pages move into the tabs in the next slices; a tab with nothing yet
 * keeps its place with its empty state (decided by the agent, 31 Oct).
 */
import type { BoxEntry } from "@lifeos/kit";
import type { DomainArea } from "./places";

export type IndexTab = "elenco" | "andamento";
export type IndexRow = Pick<BoxEntry, "fam" | "title" | "meta" | "href"> & {
  sub?: string;
};

export const AREA_INDEX: Record<DomainArea, Record<IndexTab, IndexRow[]>> = {
  corpo: {
    // Its shelves are the Elenco itself: app/(app)/[area]/elenco/shelves.tsx.
    elenco: [],
    andamento: [
      {
        fam: "body",
        sub: "weight",
        title: "Peso",
        meta: "la tendenza e l’obiettivo",
        href: "/corpo/andamento/peso",
      },
      {
        fam: "sleep",
        sub: "sleep",
        title: "Sonno",
        meta: "le notti e il voto",
        href: "/corpo/andamento/sonno",
      },
      {
        fam: "train",
        sub: "steps",
        title: "Passi",
        meta: "la media e i giorni",
        href: "/corpo/andamento/passi",
      },
    ],
  },
  cibo: {
    // Its shelves are the Elenco itself: app/(app)/[area]/elenco/shelves.tsx.
    elenco: [],
    andamento: [
      {
        fam: "drink",
        sub: "water",
        title: "Acqua",
        meta: "bevuta contro attesa",
        href: "/cibo/andamento/acqua",
      },
      {
        fam: "goal",
        title: "Come valutiamo",
        meta: "il voto dei pasti, criterio per criterio",
        href: "/oggi/andamento/come-valutiamo",
      },
    ],
  },
  mente: {
    elenco: [],
    andamento: [
      {
        fam: "mind",
        sub: "checkin",
        title: "Legami",
        meta: "cosa va insieme a cosa, nei tuoi giorni",
        href: "/mente/andamento/legami",
      },
    ],
  },
  soldi: {
    elenco: [],
    // The month of money is the Andamento itself: app/(app)/[area]/andamento/money-page.tsx.
    andamento: [],
  },
};

/** What an empty tab says: the place stays, with what will be there. */
export const EMPTY_TAB: Record<IndexTab, string> = {
  elenco: "Qui andranno le cose che riusi in quest’area: per ora nessuna.",
  andamento: "Qui andranno le tendenze di quest’area.",
};
