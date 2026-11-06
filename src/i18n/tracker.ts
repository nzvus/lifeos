/**
 * The tracker's words (PAT-93): what it is, its shape, its fields' types — said the same in its
 * create form (`TrackerForm`) and on its page (the generic ObjectPage's tracker part).
 */
export const tracker = {
  families: [
    { value: "habit", label: "Abitudine" },
    { value: "mind", label: "Mente" },
    { value: "body", label: "Corpo" },
    { value: "sleep", label: "Sonno" },
    { value: "drink", label: "Bevande" },
    { value: "food", label: "Cibo" },
  ],
  shapes: [
    { value: "instant", label: "Un momento" },
    { value: "interval", label: "Con una durata" },
  ],
  types: [
    ["number", "numero"],
    ["integer", "numero intero"],
    ["scale", "da 1 a 5"],
    ["boolean", "sì / no"],
    ["choice", "una tra più opzioni"],
    ["text", "testo"],
    ["duration", "minuti"],
  ] as [string, string][],
  page: {
    what: "Che cos'è",
    fields: "Campi",
    noFields: "Nessun campo: basta un segno",
    open: "Apri",
    newTitle: "Nuovo tracker",
    add: "Nuovo tracker",
    section: "Tracker",
    empty: "Nessun tracker tuo: creane uno.",
    emptyArchived: "Nessun tracker archiviato.",
  },
} as const;

export const wordOf = (list: readonly { value: string; label: string }[], v: string) =>
  list.find((x) => x.value === v)?.label ?? v;
