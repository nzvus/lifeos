/**
 * i18n/messages.week.it.ts — la giornata letta nella sua settimana (ADR-0047).
 */
import type { Messages } from "./index";

export const weekIt: Messages["week"] = {
  title: "Questa settimana",
  info: "Come si legge",
  infoNote:
    "L'energia è una quantità settimanale: una giornata abbondante si può bilanciare nei giorni dopo, al massimo del 30 % al giorno, così un'abbuffata non si ripaga mai digiunando. Le proteine contano giorno per giorno. Fibre, sale, zuccheri e grassi saturi contano come media. I giorni senza niente registrato non contano.",
  balanceOver: "I giorni prima: {kcal} kcal sopra i loro target ({n} registrati).",
  balanceUnder: "I giorni prima: {kcal} kcal sotto i loro target ({n} registrati).",
  balanceEven: "I giorni prima sono in linea con i target ({n} registrati).",
  adjusted:
    "Per riportare la settimana, se vuoi: circa {adjusted} kcal oggi invece di {target}.",
  capped:
    "Fermato a un limite (30 % del target del giorno, o il tuo metabolismo basale): il resto si lascia andare.",
  protein: "Proteine nella zona buona: {in} giorni su {of}.",
  average: "{name}: {avg} in media (target {target})",
  irregular:
    "Questa settimana i giorni cambiano molto: giorni più regolari sono più facili da mantenere.",
  nothing: "Niente registrato prima di questo giorno, questa settimana.",
};
