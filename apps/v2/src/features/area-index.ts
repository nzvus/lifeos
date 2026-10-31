/**
 * Map D, first slice (ADR-0059, architecture.md §10): what each area's Piano,
 * Elenco and Andamento hold today, as rows that lead to the pages that exist.
 * The pages move into the tabs in the next slices; a tab with nothing yet
 * keeps its place with its empty state (decided by the agent, 31 Oct).
 */
import type { BoxEntry } from "@lifeos/kit";
import type { DomainArea } from "./places";

export type IndexTab = "piano" | "elenco" | "andamento";
export type IndexRow = Pick<BoxEntry, "fam" | "title" | "meta" | "href"> & {
  sub?: string;
};

export const AREA_INDEX: Record<DomainArea, Record<IndexTab, IndexRow[]>> = {
  corpo: {
    piano: [
      {
        fam: "train",
        sub: "cycle",
        title: "Cicli e settimana tipo",
        meta: "gli allenamenti in ordine, passo dopo passo",
        href: "/oggi/piano",
      },
    ],
    elenco: [
      {
        fam: "train",
        sub: "exercise",
        title: "Esercizi",
        meta: "con le sessioni e i record",
        href: "/oggi/elenco?vista=esercizi",
      },
      {
        fam: "train",
        sub: "steps",
        title: "Tragitti",
        meta: "casa → palestra, casa → lavoro",
        href: "/libreria/tragitto",
      },
    ],
    andamento: [
      {
        fam: "body",
        sub: "weight",
        title: "Peso",
        meta: "la tendenza e l’obiettivo",
        href: "/andamento/peso",
      },
      {
        fam: "sleep",
        sub: "sleep",
        title: "Sonno",
        meta: "le notti e il voto",
        href: "/andamento/sonno",
      },
      {
        fam: "train",
        sub: "steps",
        title: "Passi",
        meta: "la media e i giorni",
        href: "/andamento/passi",
      },
    ],
  },
  cibo: {
    piano: [
      {
        fam: "day",
        sub: "model",
        title: "Giornate tipo",
        meta: "i pasti previsti stanno nelle giornate",
        href: "/piano/modelli",
      },
    ],
    elenco: [
      {
        fam: "food",
        sub: "ingredient",
        title: "Cibi",
        meta: "ciò che mangi, coi prodotti",
        href: "/oggi/elenco?vista=cibi",
      },
      {
        fam: "food",
        sub: "recipe",
        title: "Pasti salvati",
        meta: "da registrare con un tocco",
        href: "/oggi/elenco?vista=pasti",
      },
      {
        fam: "pantry",
        sub: "stock",
        title: "Dispensa",
        meta: "cosa compri, cosa resta",
        href: "/libreria/dispensa",
      },
    ],
    andamento: [
      {
        fam: "drink",
        sub: "water",
        title: "Acqua",
        meta: "bevuta contro attesa",
        href: "/andamento/acqua",
      },
      {
        fam: "goal",
        title: "Come valutiamo",
        meta: "il voto dei pasti, criterio per criterio",
        href: "/andamento/come-valutiamo",
      },
    ],
  },
  mente: {
    piano: [
      {
        fam: "habit",
        sub: "habit",
        title: "Abitudini",
        meta: "nel piano della settimana",
        href: "/oggi/piano",
      },
    ],
    elenco: [],
    andamento: [
      {
        fam: "mind",
        sub: "checkin",
        title: "Legami",
        meta: "cosa va insieme a cosa, nei tuoi giorni",
        href: "/andamento/legami",
      },
    ],
  },
  soldi: {
    piano: [],
    elenco: [],
    andamento: [
      {
        fam: "money",
        sub: "movement",
        title: "Soldi",
        meta: "quanto spendi e in cosa",
        href: "/andamento/soldi",
      },
    ],
  },
};

/** What an empty tab says: the place stays, with what will be there. */
export const EMPTY_TAB: Record<IndexTab, string> = {
  piano: "Qui andrà il piano di quest’area: per ora non c’è niente da pianificare.",
  elenco: "Qui andranno le cose che riusi in quest’area: per ora nessuna.",
  andamento: "Qui andranno le tendenze di quest’area.",
};
