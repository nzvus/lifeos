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
  /** Oggi · Elenco's two sections (PL-70). */
  elenco: {
    blocks: "Blocchi",
    cycles: "Cicli",
    addBlock: "Nuovo blocco",
    addCycle: "Nuovo ciclo",
    emptyBlocks:
      "Nessun blocco: un blocco è una cosa del Piano, con il suo quando e ogni quanto.",
    emptyCycles: "Nessun ciclo: passi che si danno il turno, come la palestra.",
    emptyArchived: "Niente di archiviato.",
    steps: (n: number) => F.plural(n, "passo", "passi"),
  },
  block: {
    when: {
      time: "a un'ora",
      after: "dopo un blocco",
      before: "prima di un blocco",
      wake: "dopo il risveglio",
      bed: "prima di dormire",
    },
    help: {
      when: "Senza un quando, il blocco prende l'ora a cui lo fai di solito quel giorno della settimana.",
      offsetMin:
        "Quanti minuti dopo (o prima): «30» con «prima di un blocco» è mezz'ora prima.",
    },
    what: "Che cosa",
    rotation: "A turno",
    rotationHelp: "Ogni giorno il successivo di quello che hai fatto l'ultima volta.",
    compose: "Cambia che cosa",
    find: "Cerca un pasto, una scheda, un tragitto o un tipo",
    nothing: "Ancora niente: scegli un pasto, una scheda, un tragitto o un tipo.",
    servings: (n: number) => F.plural(n, "porzione", "porzioni"),
    servingUnit: "porz.",
    kind: "tipo",
    save: "Salva",
    newTitle: "Nuovo blocco",
    errors: {
      gone: "Questo blocco non c'è più.",
      invalid: "Uno di questi non c'è più: riapri il blocco e riprova.",
      mixed: "Un tipo da solo, oppure uno o più pasti, schede, tragitti.",
    },
  },
};
