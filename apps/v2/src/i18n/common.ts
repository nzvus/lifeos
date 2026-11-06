/**
 * The words every area shares: the verbs of patterns.md §2 and the states of §7 (PAT-81,
 * DT-61). One catalogue per area joins this one as its type moves to the registry (phase 4);
 * a screen never writes a UI string inline. The glossary test reads every file here.
 */
export const common = {
  verbs: {
    add: "Aggiungi",
    open: "Apri",
    edit: "Modifica",
    save: "Salva",
    cancel: "Annulla",
    undo: "Annulla",
    done: "Fatto",
    skip: "Salta",
    startFrom: "Parti da…",
    variant: "Variante",
    merge: "Unisci",
    archive: "Archivia",
    restore: "Ripristina",
    trash: "Elimina",
    delete: "Elimina",
    saveAs: "Salva come…",
    more: "Altro",
    retry: "Riprova",
  },
  states: {
    saved: "Salvato",
    archived: "Archiviato",
    restored: "Ripristinato",
    deleted: "Eliminato",
    pending: "da inviare",
    unknown: "non so",
    why: "Perché?",
    showMore: (n: number) => `Mostra altri (${n})`,
    showLess: "Mostra meno",
    archivedFilter: "Archiviati",
  },
} as const;
