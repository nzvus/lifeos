/**
 * The words of the generic object page (PAT-04, PAT-30) and of the registry's declared fields
 * (MOD-01): a field shows its own `label` (a user kind) or its word here; one is required for
 * every declared field (objects.test.ts). PAT-93.
 */
/** A food's or product's label values per 100 (FD-04): the words of the registry's LABEL_FIELDS. */
const LABEL = {
  kcal: "Energia",
  protein: "Proteine",
  carbs: "Carboidrati",
  sugars: "di cui zuccheri",
  fat: "Grassi",
  saturatedFat: "di cui saturi",
  fibre: "Fibre",
  salt: "Sale",
  nova: "NOVA",
};

export const objects = {
  values: "Valori",
  name: "Nome",
  yes: "sì",
  no: "no",
  archived: "archiviato",
  refused: {
    in_use: "È usato altrove: puoi archiviarlo",
    name_taken: "Esiste già con questo nome",
    not_found: "Non c'è più",
    other: "Non riuscito",
  },
  merged: "Uniti",
  find: (type: string) => `Cerca ${type}`,
  /** «Unisci» (PAT-18): what moves, as [one, many] for F.plural, then the kept one's name. */
  merge: {
    entries: ["voce passa a", "voci passano a"],
    lines: [
      "riga di un pasto o di una scheda passa a",
      "righe di pasti o schede passano a",
    ],
    plans: ["posto nel Piano passa a", "posti nel Piano passano a"],
    nothing: (gone: string) =>
      `«${gone}» non è usato da nessuna parte: non si sposta niente.`,
    after: (gone: string, keep: string) =>
      `«${keep}» prende i valori che gli mancano e il nome «${gone}» come alias; «${gone}» va negli archiviati.`,
  },
  fields: {
    exercise: { guide: "Guida" },
    food: LABEL,
    product: LABEL,
    route: {
      mode: "Mezzo",
      distanceKm: "Distanza",
      durationMin: "Durata",
      walkingM: "A piedi",
      mapsUrl: "Link alla mappa",
    },
  } as Record<string, Record<string, string>>,
} as const;
