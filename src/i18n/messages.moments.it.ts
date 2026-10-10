/**
 * i18n/messages.moments.it.ts — i momenti della giornata (ADR-0011, ADR-0044).
 */
import type { Messages } from "./index";

export const momentsIt: Messages["moments"] = {
  label: "Momento",
  hint: "Precompilato dalla categoria del pasto o dall'ora; puoi cambiarlo.",
  none: "Senza momento",
  categoryLabel: "Categoria",
  categoryNone: "— nessuna",
  categoryHint: "Facoltativa: suggerisce il momento quando lo aggiungi alla giornata.",
  all: "Tutti",
  subtotal: "{v} kcal",
  names: {
    breakfast: "Colazione",
    lunch: "Pranzo",
    snack: "Spuntino",
    dinner: "Cena",
    pre_workout: "Pre-allenamento",
    post_workout: "Post-allenamento",
    pre_sleep: "Prima di dormire",
  },
  snackParts: {
    night: "Spuntino notturno",
    morning: "Spuntino di metà mattina",
    afternoon: "Merenda",
    evening: "Spuntino serale",
  },
};

/** Il programma di un tipo di giornata (ADR-0044). */
export const dayProgramIt: Messages["dayProgram"] = {
  title: "Programma",
  hint: "Quando ti alleni e mangi in questo tipo di giornata. Gli slot danno alla giornata i suoi posti e orari; le quote sono indicazioni morbide.",
  trainingAt: "Orario abituale dell'allenamento",
  trainingHint: "Vuoto = niente allenamento in questo tipo di giornata.",
  shift: "Spostamento nella settimana del check-in (kcal)",
  shiftHint:
    "+ nei giorni pesanti, − in quelli leggeri: il totale della settimana resta uguale.",
  slots: "Slot dei pasti",
  kind: "Momento",
  at: "Ora",
  kcalShare: "% kcal",
  proteinShare: "% proteine",
  add: "Aggiungi uno slot",
  remove: "Togli questo slot",
  starter: "Parti da",
  starterNone: "— scegli un modello",
  starters: {
    rest: "Giorno di riposo",
    gymMorning: "Palestra (mattina)",
    gymEvening: "Palestra (sera)",
    longCardio: "Cardio lungo",
  },
  total: "Totale: {kcal} % delle kcal · {protein} % delle proteine",
  empty: "Nessuno slot: la giornata appare come prima.",
  save: "Salva il programma",
  goalOverrides:
    "Hai un obiettivo nelle Impostazioni: deficit, proteine e grassi qui valgono solo senza obiettivo.",
};
