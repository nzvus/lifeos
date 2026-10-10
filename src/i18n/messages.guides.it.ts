/**
 * i18n/messages.guides.it.ts — the words of the exercise guides (ADR-0028),
 * one per movement pattern (core/training/guides.ts has the numbers).
 * Cues: setup and execution; mistakes: the most common ones. Guidance from
 * the usual coaching references (NSCA, ACSM), not medical advice.
 */
import type { Messages } from "./index";

export const guidesIt: Messages["guides"] = {
  section: "Guida",
  title: "Come si fa",
  cues: "Esecuzione",
  mistakes: "Errori comuni",
  numbers: "Di solito: {sets} serie × {reps} · pausa {rest}",
  numbersTime: "Di solito: {reps}",
  warmupYes: "Riscaldamento: sì, se è il primo esercizio per questi muscoli.",
  warmupNo: "Riscaldamento: di solito no, se i muscoli sono già caldi.",
  note: "Indicazioni generali, non un parere medico: con dolore, fermati.",
  today: "Oggi",
  todayLabel: "Oggi: ",
  reasons: {
    start: "{sets} × {lo}–{hi}: scegli un carico con cui potresti farne ancora 2–3",
    add_load:
      "{sets} × {lo}–{hi} × {kg} kg: l'ultima volta tutte le serie a {hi}, sali di carico",
    add_load_bw:
      "{sets} × {lo}–{hi}: tutte al massimo, aggiungi un carico o una variante più dura",
    add_reps: "{sets} × {lo}–{hi} × {kg} kg: cerca {lo} ripetizioni o più in ogni serie",
    add_reps_bw: "{sets} × {lo}–{hi}: cerca {lo} ripetizioni o più in ogni serie",
    hold: "{sets} × {lo}–{hi} × {kg} kg: stesso carico, punta ad arrivare a {lo}",
    hold_effort:
      "{sets} × {lo}–{hi} × {kg} kg: stesso carico — l'ultima volta una serie è arrivata a cedimento (0 in riserva); fermati 1–2 ripetizioni prima",
    reduce:
      "{sets} × {lo}–{hi} × {kg} kg: un gradino più leggero — due sedute di fila a cedimento",
    add_time_min: "{min} minuti (circa +10 % dall'ultima volta)",
    add_time_s: "{sets} × {s} s (circa +10 %)",
    hold_time_min: "{min} minuti per iniziare",
    hold_time_s: "{sets} × {s} s per iniziare",
  },
  best: "Migliore serie: {reps} × {kg} kg · 1RM stimato {e1rm} kg",
  patterns: {
    horizontal_press: {
      cues: [
        "Scapole addotte e depresse, petto alto; piedi ben piantati.",
        "Scendi controllando fino a sfiorare il petto (o all'altezza dei pettorali sulla macchina), gomiti a circa 45° dal busto.",
        "Spingi senza staccare spalle e glutei dalla panca; espira in spinta.",
      ],
      mistakes: [
        "Gomiti aperti a 90°: carica le spalle.",
        "Rimbalzare sul petto o accorciare il movimento.",
        "Inarcare troppo la schiena sollevando i glutei.",
      ],
    },
    vertical_press: {
      cues: [
        "Addome e glutei contratti, schiena neutra; con la panca, schiena appoggiata.",
        "Parti con i gomiti poco davanti al busto e spingi verso l'alto, avvicinando le mani sopra la testa.",
        "Scendi lentamente fino all'altezza del mento o poco sotto.",
      ],
      mistakes: [
        "Inarcare la zona lombare per spingere di più.",
        "Gomiti troppo larghi e indietro.",
        "Carico troppo alto che accorcia l'escursione.",
      ],
    },
    fly: {
      cues: [
        "Gomiti leggermente piegati e fissi per tutto il movimento.",
        "Apri fino a sentire l'allungamento del petto, senza andare oltre la linea delle spalle.",
        "Chiudi come per abbracciare un albero, stringendo il petto.",
      ],
      mistakes: [
        "Piegare e stendere i gomiti: diventa una spinta.",
        "Aprire troppo, stressando la spalla.",
        "Carichi pesanti a scapito del controllo.",
      ],
    },
    horizontal_pull: {
      cues: [
        "Busto stabile, petto alto, schiena neutra.",
        "Tira portando i gomiti indietro e vicino al corpo, avvicinando le scapole.",
        "Torna lentamente lasciando allungare la schiena, senza perdere la postura.",
      ],
      mistakes: [
        "Dondolare col busto per muovere il carico.",
        "Tirare solo con le braccia, senza muovere le scapole.",
        "Spalle che salgono verso le orecchie.",
      ],
    },
    vertical_pull: {
      cues: [
        "Presa poco più larga delle spalle, busto appena inclinato indietro, petto alto.",
        "Abbassa prima le scapole, poi porta i gomiti verso i fianchi e la barra al petto alto.",
        "Risali lentamente fino a braccia quasi tese.",
      ],
      mistakes: [
        "Tirare dietro la nuca.",
        "Dondolare indietro col busto per aiutarsi.",
        "Fermarsi a metà: niente allungamento in alto.",
      ],
    },
    rear_fly: {
      cues: [
        "Braccia quasi tese, movimento dalle spalle, non dai gomiti.",
        "Apri verso l'esterno fino all'altezza delle spalle, pollici in avanti o in basso.",
        "Pausa di un attimo a fine apertura, poi torna lentamente.",
      ],
      mistakes: [
        "Avvicinare le scapole con forza: lavora la schiena più dei deltoidi posteriori.",
        "Usare lo slancio.",
        "Carico troppo alto per il muscolo piccolo che lavora.",
      ],
    },
    lateral_raise: {
      cues: [
        "Gomiti appena piegati, busto fermo.",
        "Solleva di lato fino all'altezza delle spalle, guidando con i gomiti.",
        "Scendi lentamente: la discesa conta quanto la salita.",
      ],
      mistakes: [
        "Alzare le spalle verso le orecchie (lavora il trapezio).",
        "Slancio col busto.",
        "Salire oltre le spalle con carichi pesanti.",
      ],
    },
    curl: {
      cues: [
        "Gomiti fermi lungo i fianchi.",
        "Sali fino a contrazione piena senza muovere la spalla in avanti.",
        "Scendi fino a braccio quasi teso, controllando.",
      ],
      mistakes: [
        "Dondolare il busto.",
        "Gomiti che avanzano a fine salita.",
        "Escursione parziale in basso.",
      ],
    },
    triceps_extension: {
      cues: [
        "Gomiti fermi e vicini alla testa o ai fianchi, a seconda della variante.",
        "Stendi completamente il braccio, senza bloccare di scatto.",
        "Ritorna lentamente fino a piegare bene il gomito.",
      ],
      mistakes: [
        "Gomiti che si aprono o si muovono.",
        "Spingere col busto o le spalle.",
        "Movimento corto, senza allungamento.",
      ],
    },
    squat: {
      cues: [
        "Piedi alla larghezza delle spalle, punte leggermente in fuori; addome contratto.",
        "Scendi spingendo le anche indietro e le ginocchia nella direzione delle punte, schiena neutra.",
        "Arriva almeno con le cosce parallele (se la mobilità lo consente) e risali spingendo con tutto il piede.",
      ],
      mistakes: [
        "Ginocchia che cedono verso l'interno.",
        "Talloni che si alzano.",
        "Schiena che si arrotonda in basso.",
      ],
    },
    leg_press: {
      cues: [
        "Schiena e bacino ben appoggiati allo schienale.",
        "Piedi a metà pedana, alla larghezza delle spalle.",
        "Scendi fin dove il bacino resta appoggiato, poi spingi con tutto il piede.",
      ],
      mistakes: [
        "Bacino che si stacca in basso (schiena arrotondata).",
        "Bloccare di scatto le ginocchia in alto.",
        "Ginocchia che cedono verso l'interno.",
      ],
    },
    lunge: {
      cues: [
        "Busto alto, peso sulla gamba davanti.",
        "Scendi in verticale finché il ginocchio dietro si avvicina al pavimento.",
        "Risali spingendo col tallone della gamba davanti.",
      ],
      mistakes: [
        "Passo troppo corto: il ginocchio davanti va molto avanti.",
        "Ginocchio davanti che cede verso l'interno.",
        "Spingere con la gamba dietro.",
      ],
    },
    hinge: {
      cues: [
        "Schiena neutra dall'inizio alla fine; il carico vicino alle gambe.",
        "Il movimento parte dalle anche che vanno indietro, ginocchia appena piegate.",
        "Risali stringendo i glutei, senza inarcare la schiena in alto.",
      ],
      mistakes: [
        "Schiena arrotondata.",
        "Carico lontano dal corpo.",
        "Iperestendere la zona lombare a fine movimento.",
      ],
    },
    leg_curl: {
      cues: [
        "Ginocchio allineato al perno della macchina; bacino fermo sul sellino.",
        "Piega fino in fondo, con una breve pausa.",
        "Torna lentamente fino a gamba quasi tesa.",
      ],
      mistakes: ["Bacino che si solleva.", "Slancio nella discesa.", "Escursione corta."],
    },
    leg_extension: {
      cues: [
        "Ginocchio allineato al perno, schiena appoggiata.",
        "Stendi completamente con una breve contrazione in alto.",
        "Scendi lentamente.",
      ],
      mistakes: [
        "Calciare di slancio.",
        "Sollevare il bacino dal sedile.",
        "Lasciar cadere il peso in discesa.",
      ],
    },
    calf_raise: {
      cues: [
        "Avampiede sul bordo, ginocchia quasi tese (in piedi) o piegate (seduto).",
        "Scendi fino in fondo con allungamento, pausa di un secondo.",
        "Sali più in alto possibile e fermati un attimo.",
      ],
      mistakes: [
        "Rimbalzare in basso.",
        "Escursione corta.",
        "Piegare le ginocchia per aiutarsi.",
      ],
    },
    crunch: {
      cues: [
        "Avvicina le costole al bacino arrotondando la parte alta della schiena.",
        "Espira mentre chiudi.",
        "Torna lentamente senza appoggiarti del tutto.",
      ],
      mistakes: [
        "Tirare il collo con le mani.",
        "Usare lo slancio.",
        "Movimento dalle anche invece che dall'addome.",
      ],
    },
    leg_raise: {
      cues: [
        "Spalle stabili; da appeso, niente oscillazioni.",
        "Solleva le gambe arrotondando il bacino verso l'alto alla fine.",
        "Scendi lentamente senza dondolare.",
      ],
      mistakes: [
        "Oscillare per salire.",
        "Muovere solo le anche, senza arrotolare il bacino.",
        "Lasciar cadere le gambe.",
      ],
    },
    plank: {
      cues: [
        "Gomiti sotto le spalle, corpo in linea dalla testa ai talloni.",
        "Glutei e addome contratti; respira normalmente.",
        "Fermati quando la posizione cede, non quando suona il timer.",
      ],
      mistakes: ["Bacino che scende.", "Glutei troppo alti.", "Trattenere il respiro."],
    },
    run: {
      cues: [
        "Passo corto e frequente, appoggio sotto il corpo.",
        "Ritmo a cui riesci ancora a parlare per la maggior parte delle uscite.",
        "Aumenta il volume settimanale di circa il 10 % alla volta.",
      ],
      mistakes: [
        "Partire troppo forte.",
        "Aumentare chilometri e intensità insieme.",
        "Ignorare dolori che non passano.",
      ],
    },
    bike: {
      cues: [
        "Sellino all'altezza dell'anca: in basso il ginocchio resta appena piegato.",
        "Cadenza regolare, 80–95 pedalate al minuto.",
        "Resistenza che permette di parlare a frasi brevi.",
      ],
      mistakes: [
        "Sellino troppo basso (ginocchia sotto sforzo).",
        "Resistenza troppo alta a bassa cadenza.",
        "Spalle contratte e busto rigido.",
      ],
    },
  },
};
