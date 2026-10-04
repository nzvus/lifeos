/** i18n/messages.supplements.it.ts — bevande e integratori (ADR-0039). */
import type { Messages } from "./index";

export const supplementsIt: Messages["supplements"] = {
  title: "Caffeina e creatina",
  caffeine: "Caffeina",
  creatine: "Creatina",
  caffeineWords: "Caffeina oggi {day} mg; in circolo ora ~{now} mg",
  now: "in circolo ora ~{v} mg",
  bed: "a letto ~{v} mg",
  bedHigh: "a letto ~{v} mg: può disturbare il sonno",
  creatineWords:
    "Scorte di creatina piene al ~{pct} %; oggi {g} g; {days} giorni degli ultimi 30",
  creatineLine: "oggi {g} g · {days}/30 giorni con creatina",
  infoLabel: "Come si stima",
  info: "Stime, non misure. Caffeina: assorbita in circa un'ora, si dimezza circa ogni 5 ore; fino a 400 mg al giorno è sicura per adulti sani (EFSA), e sopra ~50 mg all'ora di dormire il sonno può risentirne. Creatina: 3–5 g al giorno riempiono le scorte muscolari in circa 4 settimane; senza, tornano alla base in circa 5. Registra caffè, energy drink e creatina come ingredienti con i loro principi attivi (Cibo → Ingredienti).",
  chartTitle: "Caffeina al giorno",
  chartNone: "Nessuna caffeina registrata nel periodo.",
  chartSummary:
    "~{avg} mg in media · giorni oltre 400: {over} · giorni con creatina: {creatine}, scorte ~{pct} %",
  session:
    "Fatta con ~{caffeine} mg di caffeina in circolo · scorte di creatina ~{pct} %",
};
