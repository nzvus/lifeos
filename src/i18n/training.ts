/**
 * The words of an esercizio's and a scheda's sections on the generic object page (PAT-04,
 * PAT-30; change 2026-11-07-exercise-scheda). PAT-81, PAT-93.
 */
import { F } from "@lifeos/kit";

export const training = {
  exercise: {
    sessions: (n: number) => F.plural(n, "sessione", "sessioni"),
    best: "e1RM migliore",
    log: "Sessioni",
    never: "Ancora mai fatto.",
    noSet: "nessuna serie",
    notInRoutine: "In nessuna scheda.",
    usedIn: "Le schede con questo esercizio",
  },
  routine: {
    newTitle: "Nuova scheda",
    list: "Le tue schede",
    shelf: "gli esercizi di una sessione, in ordine",
    none: "Ancora nessuna scheda: componila qui, o salvala da una sessione.",
    add: "+ Nuova scheda",
    name: "Nome della scheda",
    namePlaceholder: "per esempio: Push",
    exercises: "Esercizi",
    find: "Cerca un esercizio",
    empty: "Cerca un esercizio e toccalo: l'ordine è quello della sessione.",
    save: "Salva la scheda",
    start: "Inizia",
    compose: "Cambia gli esercizi",
    meta: (n: number, uses: number) =>
      F.plural(n, "esercizio", "esercizi") +
      " · " +
      F.plural(uses, "volta", "volte") +
      " in 90 giorni",
    errors: {
      name: "Dai un nome alla scheda.",
      taken: "Hai già una scheda con questo nome.",
      lines: "Aggiungi almeno un esercizio.",
      gone: "Questa scheda non c'è più.",
    },
  },
} as const;
