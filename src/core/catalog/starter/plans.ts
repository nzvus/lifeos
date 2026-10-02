/**
 * core/catalog/starter/plans.ts — the starter pack's routines and programs
 * (ADR-0034), made of the exercises in ./training.ts (by name). Sets, reps
 * and rests follow the common ranges (ACSM, NSCA); no loads.
 */
import type { PackInput } from "../pack";

type P = Required<Pick<PackInput, "routines" | "programs">>;

type Item = P["routines"][number]["items"][number];
const r = (exercise: string, sets: number, reps: number, restS: number): Item => ({
  exercise,
  sets,
  reps,
  restS,
});
const hold = (
  exercise: string,
  sets: number,
  durationS: number,
  restS: number | null = 60,
): Item => ({
  exercise,
  sets,
  durationS,
  restS,
});

export const STARTER_ROUTINES: P["routines"] = [
  {
    name: "Full body A",
    notes: "Tutto il corpo in un'ora: un esercizio per ogni movimento principale.",
    items: [
      r("Goblet squat", 3, 10, 120),
      r("Chest press alla macchina", 3, 10, 120),
      r("Lat machine avanti", 3, 10, 120),
      r("Stacco rumeno con manubri", 3, 10, 120),
      r("Alzate laterali con manubri", 3, 12, 60),
      hold("Plank", 3, 40),
    ],
  },
  {
    name: "Full body B",
    notes: "Da alternare con la A: gli stessi movimenti con altri esercizi.",
    items: [
      r("Leg press", 3, 10, 120),
      r("Panca inclinata con manubri", 3, 10, 120),
      r("Pulley basso", 3, 10, 120),
      r("Affondi con manubri", 3, 10, 90),
      r("Lento avanti con manubri", 3, 10, 90),
      r("Crunch", 3, 15, 60),
    ],
  },
  {
    name: "Push",
    notes: "Spinte: petto, spalle, tricipiti.",
    items: [
      r("Panca piana con bilanciere", 4, 8, 150),
      r("Panca inclinata con manubri", 3, 10, 120),
      r("Lento avanti con manubri", 3, 10, 90),
      r("Alzate laterali con manubri", 3, 12, 60),
      r("Croci ai cavi", 3, 12, 60),
      r("Push down ai cavi", 3, 12, 60),
    ],
  },
  {
    name: "Pull",
    notes: "Tirate: dorso, deltoidi posteriori, bicipiti.",
    items: [
      r("Trazioni alla sbarra", 4, 6, 150),
      r("Rematore con bilanciere", 3, 8, 120),
      r("Lat machine avanti", 3, 10, 90),
      r("Face pull ai cavi", 3, 15, 60),
      r("Curl con bilanciere", 3, 10, 60),
      r("Curl a martello", 3, 12, 60),
    ],
  },
  {
    name: "Legs",
    notes: "Gambe e glutei.",
    items: [
      r("Squat con bilanciere", 4, 6, 180),
      r("Stacco rumeno con manubri", 3, 8, 120),
      r("Leg press", 3, 10, 120),
      r("Leg curl seduto", 3, 12, 60),
      r("Leg extension", 3, 12, 60),
      r("Calf raise in piedi", 4, 12, 60),
    ],
  },
  {
    name: "Upper",
    notes: "Parte alta: una spinta e una tirata orizzontali, poi verticali.",
    items: [
      r("Panca piana con bilanciere", 3, 8, 150),
      r("Rematore con manubrio", 3, 10, 90),
      r("Military press con bilanciere", 3, 8, 120),
      r("Lat machine avanti", 3, 10, 90),
      r("Curl ai cavi", 3, 12, 60),
      r("Estensioni sopra la testa ai cavi", 3, 12, 60),
    ],
  },
  {
    name: "Lower",
    notes: "Parte bassa e addome.",
    items: [
      r("Squat con bilanciere", 3, 8, 180),
      r("Hip thrust", 3, 10, 120),
      r("Bulgarian split squat", 3, 10, 90),
      r("Leg curl sdraiato", 3, 12, 60),
      r("Calf raise in piedi", 3, 15, 60),
      r("Sollevamento gambe alla sbarra", 3, 12, 60),
    ],
  },
  {
    name: "Core 10 minuti",
    notes: "Da fare in fondo a un allenamento o da sola.",
    items: [
      hold("Plank", 3, 45, 30),
      hold("Plank laterale", 2, 30, 30),
      r("Crunch", 3, 15, 30),
      r("Russian twist", 3, 20, 30),
      r("Sollevamento gambe alla sbarra", 3, 10, 45),
    ],
  },
  {
    name: "Cardio facile 30 minuti",
    notes: "A un ritmo in cui riesci a parlare (zona 2).",
    items: [hold("Cyclette", 1, 1800, null)],
  },
  {
    name: "Corsa facile 30 minuti",
    notes: "A un ritmo in cui riesci a parlare; cammina se serve.",
    items: [hold("Corsa", 1, 1800, null)],
  },
];

const rest = { label: "Riposo" };
export const STARTER_PROGRAMS: P["programs"] = [
  {
    name: "Full body 3 giorni",
    notes: "Per iniziare: tre allenamenti a settimana, A e B alternate.",
    slots: [
      { routine: "Full body A" },
      rest,
      { routine: "Full body B" },
      rest,
      { routine: "Full body A" },
      rest,
      rest,
    ],
  },
  {
    name: "Upper/Lower 4 giorni",
    notes: "Ogni muscolo due volte a settimana.",
    slots: [
      { routine: "Upper" },
      { routine: "Lower" },
      rest,
      { routine: "Upper" },
      { routine: "Lower" },
      rest,
      rest,
    ],
  },
  {
    name: "Push Pull Legs",
    notes: "Tre giorni di fila e uno di riposo; il ciclo scorre sulla settimana.",
    slots: [{ routine: "Push" }, { routine: "Pull" }, { routine: "Legs" }, rest],
  },
  {
    name: "Forza e cardio",
    notes: "Due full body e due sedute di cardio facile a settimana.",
    slots: [
      { routine: "Full body A" },
      { routine: "Cardio facile 30 minuti" },
      rest,
      { routine: "Full body B" },
      { routine: "Corsa facile 30 minuti" },
      rest,
      rest,
    ],
  },
];
