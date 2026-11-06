/**
 * The kit's own words (PAT-81, DT-61): the verbs and states every piece says, whatever the
 * type. A type's words come from the caller's catalogue (`src/i18n/`); the glossary
 * test reads this file too, so no «Not» word of product.md §3 reaches a piece.
 */
export const WORDS = {
  undo: "Annulla",
  cancel: "Annulla",
  close: "Chiudi",
  more: "Altro",
  retry: "Riprova",
  save: "Salva",
  why: "Perché?",
  unknown: "non so",
  missing: "Manca",
  showMore: (n: number) => `Mostra altri (${n})`,
  showLess: "Mostra meno",
  noMatch: "Nessun risultato",
  sortBy: "Ordina per",
  refresh: "Aggiorna ai valori attuali",
  sections: { progress: "Andamento", usedIn: "Usato in" },
  less: "Meno",
  plus: "Di più",
  status: { planned: "previsto", done: "fatto", skipped: "saltato" },
  verbs: {
    startFrom: "Parti da…",
    variant: "Variante",
    merge: "Unisci",
    archive: "Archivia",
    restore: "Ripristina",
    delete: "Elimina",
    trash: "Elimina",
    saveAs: "Salva come…",
    edit: "Modifica",
  },
  whySheet: {
    formula: "Come si calcola",
    inputs: "Con quali dati",
    coverage: "Quanti dati",
    fascia: "La fascia",
    version: "Versione della formula",
  },
  form: {
    required: "Serve un valore",
    number: "Scrivi un numero",
    whole: "Scrivi un numero intero",
    between: (min: string, max: string) => `Scrivi un valore tra ${min} e ${max}`,
    yes: "Sì",
    no: "No",
  },
  confidence: {
    typed: "scritto da te",
    weighed: "pesato",
    label: "dall'etichetta",
    estimate: "stima",
    assumed: "ipotizzato, da confermare",
  },
} as const;
