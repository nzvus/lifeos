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
} as const;
