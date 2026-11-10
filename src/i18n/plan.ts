/**
 * The Piano's words (PAT-81; product.md §3: blocco, ciclo, scheda, abitudine, Piano — never
 * «modello», «routine», «regola», PL-71). Change 2026-11-07-piano.
 */
import { F } from "@lifeos/kit";

export const plan = {
  cycle: {
    /** «5 passi · oggi Legs, poi Rest». */
    meta: (
      steps: number,
      today: { label: string; late: boolean; next: string | null } | null,
    ) =>
      F.plural(steps, "passo", "passi") +
      (today
        ? " · oggi " +
          today.label +
          (today.late ? " (in ritardo)" : "") +
          (today.next ? ", poi " + today.next : "")
        : ""),
    /** Its rules' values (the old editor's words). */
    advance: { occurrence: "a ogni sessione", date: "per data" },
    onSkip: { lose: "si perde", shift: "slitta" },
    help: {
      advance:
        "A ogni sessione: il passo resta finché non lo fai (un riposo passa da solo). Per data: un passo al giorno, comunque vada.",
      onSkip:
        "Si perde: il ciclo va avanti come se l’avessi fatto. Slitta: il passo saltato resta il prossimo.",
    },
    steps: "Passi",
    compose: "Cambia i passi",
    find: "Aggiungi una scheda",
    rest: "Riposo",
    addRest: "+ Riposo",
    restMeta: "riposo: niente da fare",
    scheda: "scheda",
    today: "oggi",
    history: (days: number) => `Gli ultimi ${days} giorni`,
    noHistory: "Nessuna sessione di questo ciclo.",
    done: "fatto",
    save: "Salva i passi",
    empty: "Nessun passo: aggiungi una scheda o un riposo.",
    newTitle: "Nuovo ciclo",
    errors: {
      gone: "Questo ciclo non c'è più.",
      invalid: "Una scheda non c'è più: riapri il ciclo e riprova.",
      lines: "Aggiungi almeno un passo.",
    },
  },
};
