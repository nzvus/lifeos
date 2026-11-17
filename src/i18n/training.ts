/**
 * The words of an esercizio's and a scheda's sections on the generic object page (PAT-04,
 * PAT-30; change 2026-11-07-exercise-scheda). PAT-81, PAT-93.
 */
import { F } from "@lifeos/kit";

/** An esercizio's declared fields (registry, target.md §7.4): their words and their values'. */
export const EXERCISE_FIELDS = {
  pattern: "Movimento",
  equipment: "Attrezzo",
  sides: "Lati",
  muscleGroups: "Muscoli",
  loadStepKg: "Salto di carico",
  restS: "Recupero",
  setupS: "Posizionamento",
  warmup: "Riscaldamento",
  guide: "Guida",
};

export const PATTERN_WORDS: Record<string, string> = {
  horizontal_press: "Spinta orizzontale (panca, chest press)",
  vertical_press: "Spinta verticale (lento avanti)",
  horizontal_pull: "Tirata orizzontale (rematore, pulley)",
  vertical_pull: "Tirata verticale (lat machine, trazioni)",
  squat: "Squat",
  leg_press: "Leg press",
  lunge: "Affondi",
  hinge: "Stacchi, hip thrust",
  fly: "Croci",
  rear_fly: "Croci inverse",
  lateral_raise: "Alzate laterali",
  curl: "Curl bicipiti",
  triceps_extension: "Tricipiti",
  leg_curl: "Leg curl",
  leg_extension: "Leg extension",
  calf_raise: "Polpacci",
  crunch: "Crunch, addominali",
  leg_raise: "Sollevamento gambe",
  plank: "Plank (a tempo)",
  run: "Corsa (a tempo)",
  bike: "Bici (a tempo)",
  other: "Altro",
};

export const EQUIPMENT_WORDS: Record<string, string> = {
  barbell: "Bilanciere",
  dumbbell: "Manubri",
  cable: "Cavi",
  machine: "Macchina",
  bodyweight: "Corpo libero",
};

export const SIDES_WORDS: Record<string, string> = {
  both: "Insieme",
  one_at_a_time: "Un lato alla volta",
  per_side: "Insieme, carico per lato",
};

/** What a field means, under it while it is edited (PAT-61). */
export const EXERCISE_HELP: Record<string, string> = {
  sides:
    "Un lato alla volta: ogni lato è una serie. Carico per lato: scrivi il peso di un lato, l'app conta il doppio.",
  muscleGroups:
    "Il principale per primo, poi fino a tre secondari, separati da virgola (chest, triceps…).",
  loadStepKg:
    "Il salto più piccolo che puoi fare. Vuoto: dall'attrezzo (manubri a coppie, macchina 5 kg, cavi 2,5 kg, bilanciere 2,5 kg).",
  restS: "Vuoto: la tua media, poi quella consigliata.",
  setupS: "Il tempo per mettersi in posizione prima della serie. Vuoto: 5 s.",
  warmup: "No: niente serie di riscaldamento proposte.",
};

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
