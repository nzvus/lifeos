/**
 * features/progress/models.ts — «Come valutiamo» (V-16, the board Scores):
 * each E7 model in the person's words — its name, what it judges, each
 * part's name and why, its weight as a share and the range it may move in,
 * locked health limits. The words are the board's; the numbers come from
 * the registry (core/engines/judgements), so the page never disagrees with
 * the scores. Pure.
 */
import { F } from "@lifeos/kit";
import { REGISTRY, type ScoringModel } from "@/core/engines/judgements";

type Words = {
  name: string;
  fam: string;
  sub: string;
  intro: string;
  parts: Record<string, { name: string; why: string }>;
};

/** In the order of the tabs; the registry's ids. */
export const MODEL_WORDS: Record<string, Words> = {
  food: {
    name: "Pasto",
    fam: "food",
    sub: "dinner",
    intro:
      "Ogni 100 kcal: quanto nutre, quanto rispetta i limiti, quanto costa, quanto serve al suo momento. NOVA (quanto è trasformato) resta visibile accanto al pasto, ma non conta: il voto misura già ciò che contiene.",
    parts: {
      density: {
        name: "Densità di nutrienti",
        why: "Proteine pesate per qualità (DIAAS), fibra, potassio, calcio, ferro, magnesio, vitamine A, C, D, folati e omega-3, ogni 100 kcal, contro il fabbisogno di riferimento.",
      },
      limits: {
        name: "Limiti rispettati",
        why: "Zuccheri liberi, sodio, grassi saturi e trans ogni 100 kcal: meno è meglio, con le soglie dell’OMS.",
      },
      value: {
        name: "Valore per euro",
        why: "Quanti nutrienti utili compri con un euro, dai prezzi dei tuoi acquisti.",
      },
      fit: {
        name: "Adatto al suo momento",
        why: "Quanto copre la parte del giorno che il blocco chiede (kcal e proteine).",
      },
    },
  },
  weighing: {
    name: "Peso",
    fam: "body",
    sub: "weight",
    intro:
      "Non giudica il numero: giudica quanto la pesata è affidabile e se il ritmo segue l’obiettivo.",
    parts: {
      reliable: {
        name: "Pesata affidabile",
        why: "Al mattino, a digiuno, dopo il bagno, stessa bilancia: ogni condizione mancante abbassa il voto e il peso della pesata nel trend.",
      },
      pace: {
        name: "Ritmo vs obiettivo",
        why: "La pendenza del trend contro quella che serve per arrivare in tempo, dentro il ritmo sicuro (0,25–1 % del peso a settimana).",
      },
      consistency: {
        name: "Costanza delle pesate",
        why: "Quanti giorni su 7 hai una pesata valida: più punti, trend più stabile.",
      },
    },
  },
  sleep: {
    name: "Sonno",
    fam: "sleep",
    sub: "wake",
    intro:
      "Quanto hai dormito contro quanto ti serve, e quanto sono regolari gli orari: per la salute conta quanto la durata.",
    parts: {
      duration: {
        name: "Durata vs bisogno",
        why: "Le ore dormite contro il tuo bisogno (7–9 h per un adulto).",
      },
      regularity: {
        name: "Regolarità",
        why: "Quanto orari di letto e sveglia restano vicini alla media dei 7 giorni: predice la salute almeno quanto la durata.",
      },
      feel: {
        name: "Come ti senti",
        why: "L’energia del mattino che segni al risveglio.",
      },
    },
  },
  water: {
    name: "Acqua",
    fam: "drink",
    sub: "water",
    intro:
      "Quanto hai bevuto contro quanto serve a quest’ora, contando l’allenamento e l’acqua dei cibi.",
    parts: {
      expected: {
        name: "Bevuta vs attesa a quest’ora",
        why: "Il bisogno del giorno distribuito sulle ore da sveglio, contro quanto hai bevuto finora.",
      },
      afterTraining: {
        name: "Dopo l’allenamento",
        why: "1,25–1,5 volte il sudore stimato, entro 2 ore dalla fine.",
      },
      spread: {
        name: "Distribuita nel giorno",
        why: "Poco alla volta, e poco nelle 2 ore prima di dormire.",
      },
    },
  },
  session: {
    name: "Sessione",
    fam: "train",
    sub: "",
    intro:
      "Se stai progredendo, se il volume è quello del blocco, se lo sforzo è nella zona utile e i riposi bastano.",
    parts: {
      progression: {
        name: "Progressione",
        why: "Forza stimata (e1RM) o ripetizioni allo stesso carico contro le ultime sessioni.",
      },
      volume: {
        name: "Volume",
        why: "Serie allenanti contro quelle che il blocco chiede.",
      },
      effort: {
        name: "Sforzo",
        why: "Ripetizioni di riserva (RIR) nella zona prevista.",
      },
      rests: {
        name: "Riposi",
        why: "Riposi vicini a quelli previsti: troppo corti tolgono ripetizioni alle serie dopo.",
      },
    },
  },
  day: {
    name: "Giorno",
    fam: "day",
    sub: "",
    intro:
      "Un riassunto dei domini, mai i loro numeri mescolati: i voti degli altri modelli, pesati.",
    parts: {
      dayTargets: {
        name: "Obiettivi del giorno",
        why: "Ogni macro, ogni limite e i micronutrienti insieme, ciascuno per la sua zona.",
      },
      recovery: {
        name: "Recupero",
        why: "Il voto della notte: durata, regolarità, come ti senti.",
      },
      habits: {
        name: "Abitudini",
        why: "Quanto di ciò che era previsto per il giorno è stato fatto.",
      },
    },
  },
};

export type ModelPage = {
  id: string;
  name: string;
  fam: string;
  sub: string;
  intro: string;
  since: string;
  sources: string;
  parts: {
    key: string;
    name: string;
    why: string;
    /** The default weight as a share of the total, "40 %". */
    share: string;
    /** Its weight's own number and the range it may move in. */
    weight: number;
    min: number;
    max: number;
    locked: boolean;
  }[];
};

export function modelPage(model: ScoringModel): ModelPage {
  const w = MODEL_WORDS[model.id]!;
  const total = model.parts.reduce((a, p) => a + p.weight.default, 0) || 1;
  return {
    id: model.id,
    name: w.name,
    fam: w.fam,
    sub: w.sub,
    intro: w.intro,
    since: model.date,
    sources: model.sources.join(" · "),
    parts: model.parts.map((p) => ({
      key: p.key,
      name: w.parts[p.key]?.name ?? p.key,
      why: w.parts[p.key]?.why ?? p.why,
      share: F.num((p.weight.default / total) * 100, "%"),
      weight: p.weight.default,
      min: p.weight.min,
      max: p.weight.max,
      locked: !!p.locked,
    })),
  };
}

/** The models with words, in the tabs' order. */
export const MODELS = Object.keys(MODEL_WORDS).flatMap((id) => {
  const m = REGISTRY.find((r) => r.id === id);
  return m ? [m] : [];
});
