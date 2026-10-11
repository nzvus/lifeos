/**
 * i18n/messages.goal.it.ts — la spesa imparata (ADR-0041/0042), l'obiettivo e il
 * check-in settimanale (ADR-0043); separato da messages.home.it.ts.
 */
import type { Messages } from "./index";

export const calibrationIt: Messages["energy"]["calibration"] = {
  title: "Calibrazione",
  how: "Impara dagli ultimi {days} giorni insieme: quanto hai mangiato e come è cambiato il peso dicono quanto spendi davvero. Le settimane recenti contano di più.",
  fewWeighIns: "Servono almeno 6 pesate in 2 settimane (ora {n}).",
  fewLogged: "Servono almeno 14 giorni completi, e metà dei giorni (ora {n} su {of}).",
  expenditure: "Spendi",
  expenditureValue: "{mid} kcal al giorno ({low}–{high})",
  learnt: "Imparato da {weeks} settimane · attività quotidiana {factor} ± {sigma}",
  unsure:
    "Non ancora abbastanza sicuro per proporre un cambio (± {sigma}): più pesate e giorni registrati lo restringono.",
  incomplete:
    "{n} giorni registrati sotto il 60 % di quanto costano sono stati presi come registrati a metà e riempiti con i giorni vicini.",
  closed:
    "{n} giorni chiusi da te: contano pienamente (completi) o non vengono letti come un deficit (manca qualcosa). Chiudi la giornata dal suo chip in Oggi.",
  estimates:
    "Il {share} % di quanto hai registrato erano stime (pasti fuori, totali scritti a mano): contano meno.",
  estimateFactor: "Le tue stime sembrano × {k} (± {sigma}) di quanto mangi davvero.",
  intake: "Mangiato in media",
  trend: "Andamento del peso",
  trendValue: "{kg} kg a settimana",
  observed: "Speso secondo la bilancia",
  estimated: "Speso secondo il modello",
  fits: "Il modello è in linea con i tuoi dati (attività quotidiana {now}).",
  proposal: "Proposta: attività quotidiana {factor} (ora {now}).",
  accept: "Accetta",
  accepted: "Attività quotidiana ora {factor}",
  reset: "Torna a ×1,00 (ora {now})",
  wasReset: "Calibrazione azzerata",
  withCheckin: "Un nuovo fattore si accetta con il check-in settimanale.",
};

export const weightGoalIt: Messages["energy"]["weightGoal"] = {
  title: "Obiettivo",
  hint: "Di' cosa vuoi e, se vuoi, un peso obiettivo e una data. L'app pianifica quanto in fretta, nei range che salvano i muscoli; i tipi di giornata dinamici lo seguono e un check-in settimanale fissa i 7 giorni dopo.",
  none: "Nessun obiettivo: i tipi di giornata dinamici usano il loro deficit.",
  kind: "Per cosa",
  kinds: {
    lose: "Perdere grasso",
    gain: "Aumentare i muscoli",
    recomp: "Ricomposizione (meno grasso, più muscoli)",
    maintain: "Mantenere",
  },
  yourGoal: "Il tuo obiettivo",
  kindsShort: {
    lose: "Dimagrimento",
    gain: "Aumento muscolare",
    recomp: "Ricomposizione",
    maintain: "Mantenimento",
  },
  targetKg: "Peso obiettivo (kg, facoltativo)",
  targetKgHint:
    "Facoltativo. Per perdere 3 kg di grasso, il tuo peso meno 3. Le proteine sono per kg di questo.",
  targetDay: "Entro il (facoltativo)",
  targetDayHint: "Vuoto = al ritmo consigliato.",
  planTitle: "Il piano",
  planNoWeight: "Aggiungi una pesata per vedere il piano.",
  planRate:
    "{rate} % del peso a settimana: circa {kg} kg a settimana, {kcal} kcal al giorno {dir} quanto spendi.",
  planBelow: "sotto",
  planAbove: "sopra",
  planOptimal: "Nel range consigliato ({low}–{high} % a settimana).",
  planFastLose:
    "Troppo in fretta per quella data: il massimo che salva i muscoli è {high} % a settimana. A quel ritmo ci arrivi verso il {day}.",
  planFastGain:
    "Troppo in fretta per quella data: oltre {high} % a settimana si prende soprattutto grasso. A quel ritmo ci arrivi verso il {day}.",
  planSlow:
    "Più lento di quanto potrebbe, e va bene: il range consigliato è {low}–{high} % a settimana.",
  planWhen: "A questo ritmo arrivi a {kg} kg verso il {day}.",
  planReached: "Obiettivo raggiunto: mangia quanto spendi, o imposta un nuovo obiettivo.",
  planRecomp:
    "Mangia quanto spendi, con proteine alte: il grasso scende e i muscoli salgono piano, la bilancia si muove poco. A guidarla è l'allenamento. Con un peso obiettivo più basso perdi anche grasso, lentamente (0,25–0,5 % a settimana).",
  planMaintain: "Mangia quanto spendi.",
  planUpdates: "Ogni check-in settimanale ripianifica il ritmo dall'andamento del peso.",
  floor: "Soglia minima di calorie",
  floors: {
    standard: "Standard (il tuo metabolismo basale)",
    low: "Bassa (1.200 kcal)",
  },
  protein: "Proteine",
  proteins: {
    low: "Basse (1,6 g/kg)",
    moderate: "Moderate (1,8 g/kg)",
    high: "Alte (2,0 g/kg)",
    extra: "Extra (2,2 g/kg)",
  },
  split: "Ripartizione",
  splits: {
    balanced: "Bilanciata (grassi 25 %)",
    low_fat: "Pochi grassi (grassi 20 %)",
    low_carb: "Pochi carboidrati (grassi 35 %)",
  },
  weeklyCheckIn: "Check-in settimanale",
  weeklyCheckInHint:
    "Spento: ogni giorno segue l'obiettivo da solo, giorno per giorno. Acceso: una volta a settimana l'app propone i 7 giorni dopo da quanto hai speso davvero, e tu accetti o salti; una settimana accettata resta fissata.",
  undo: "Annulla il check-in",
  undone: "Check-in annullato: i giorni seguono di nuovo l'obiettivo",
  explain: {
    title: "Come nasce questo numero",
    spend:
      "Oggi spendi ~{total} kcal: il corpo a riposo {bmr}, l'attività quotidiana {everyday}, i passi {steps}, l'allenamento {training}.",
    goalTakes:
      "Il tuo obiettivo ({kind}, {rate} % a settimana) toglie {kcal} kcal al giorno.",
    goalAdds:
      "Il tuo obiettivo ({kind}, {rate} % a settimana) aggiunge {kcal} kcal al giorno.",
    goalSteady: "Il tuo obiettivo ({kind}) ti tiene a quanto spendi.",
    checkin:
      "Il check-in del {day} ha fissato questa settimana a {kcal} kcal al giorno, da una spesa media di {exp} kcal.",
    checkinShift: "Il programma di questo giorno lo sposta di {shift} kcal.",
    typeTakes: "Il tipo di giornata toglie {kcal} kcal.",
    typeAdds: "Il tipo di giornata aggiunge {kcal} kcal.",
    floor: "La tua soglia minima lo alza di {kcal} kcal.",
    result: "= {kcal} kcal da mangiare.",
    split:
      "Proteine {protein} g ({perKg} g × {kg} kg) · grassi {fat} g ({share} % delle kcal) · carboidrati {carbs} g, il resto.",
  },
  weekday: "Giorno del check-in",
  weekdays: [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ],
  changed:
    "Un cambio vale per i giorni non fissati da un check-in; la settimana già fissata tiene i suoi numeri.",
  lineGoal: "{rate} % a settimana",
  lineCheckin: "settimana fissata al check-in",
  checkinTitle: "Check-in settimanale",
  checkinSpend:
    "Spendi in media ~{kcal} kcal al giorno (ultimi 7 giorni, allenamenti compresi)",
  checkinWas: "(ultimo check-in {kcal})",
  checkinLearnt: "Imparato dal tuo diario e dalla bilancia.",
  checkinModel: "Stimato dal modello: non ancora imparato dai tuoi dati.",
  checkinTarget: "Prossimi 7 giorni, ogni giorno: {kcal} kcal",
  checkinShifted:
    "Prossimi 7 giorni, in media {kcal} kcal; i programmi dei giorni la spostano:",
  checkinMacros: "proteine {protein} g · grassi {fat} g · carboidrati {carbs} g",
  checkinFloored: "Fermato alla tua soglia minima.",
  checkinFactor: "Accettando, l'attività quotidiana diventa {factor}.",
  checkinMissing: "Mancano i dati del corpo o una pesata: ancora nessuna proposta.",
  accept: "Accetta",
  skip: "Salta questa settimana",
  accepted: "Settimana fissata: {kcal} kcal al giorno",
  skipped: "Saltato: i giorni seguono l'obiettivo",
};
