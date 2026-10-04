/**
 * i18n/messages.plan.it.ts — the Plan in Training (ADR-0035/0036), split
 * out of messages.home.it.ts (800-line limit).
 */
import type { Messages } from "./index";

export const planIt: Messages["plan"] = {
  title: "Piano",
  tab: "Piano e programmi",
  close: "Chiudi",
  openDay: "Apri il giorno",
  program: "Programma",
  skip: "Salta",
  skipHint:
    "Salta: il ciclo va avanti e niente resta in ritardo. Riposo: il ciclo aspetta.",
  backToCycle: "Come da ciclo",
  instead: "Fai invece",
  addRoutine: "Aggiungi una scheda",
  added: "Scheda aggiunta al giorno",
  nothingThatDay: "Niente in programma.",
  calendar: "Calendario",
  week: "Settimana",
  month: "Mese",
  prev: "Mese precedente",
  next: "Mese successivo",
  prevWeek: "Settimana precedente",
  nextWeek: "Settimana successiva",
  backToToday: "Torna a oggi",
  free: "—",
  remove: "Togli «{name}» dal giorno",
  removed: "«{name}» tolta dal giorno",
  undo: "Annulla",
  programItemHint:
    "Le schede del programma non si cancellano dal giorno: salta il giorno, o fai invece un altro giorno del ciclo.",
  programs: "Programmi",
  late: "in ritardo",
  changed: "cambiato",
  legendDone: "fatto",
  legendPlanned: "previsto",
  legendRest: "riposo",
  coming: "Prossimi giorni · {name}",
  noProgram:
    "Nessun programma attivo: creane uno qui sotto (o con il +) per vedere i prossimi giorni.",
  rest: "Riposo",
};
