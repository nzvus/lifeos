/**
 * The words of the generic object page (PAT-04, PAT-30) and of the registry's declared fields
 * (MOD-01): a field shows its own `label` (a user kind) or its word here; one is required for
 * every declared field (objects.test.ts). PAT-93.
 */
export const objects = {
  values: "Valori",
  noValues: "Nessun valore",
  yes: "sì",
  no: "no",
  archived: "archiviato",
  refused: {
    in_use: "È usato altrove: puoi archiviarlo",
    name_taken: "Esiste già con questo nome",
    not_found: "Non c'è più",
    other: "Non riuscito",
  },
  fields: {
    exercise: { guide: "Guida" },
    route: {
      mode: "Mezzo",
      distanceKm: "Distanza",
      durationMin: "Durata",
      walkingM: "A piedi",
      mapsUrl: "Link alla mappa",
    },
  } as Record<string, Record<string, string>>,
} as const;
