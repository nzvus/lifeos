/**
 * The visualization engine on three classes (MOD-56, MOD-57; bars-study §17.2, slice 2): an
 * intake (water), an activity (a gym session), a state (sleep). The gallery asks the engine with
 * a frame and a level and hands each view to `MeasureView`: no drawing chosen here.
 * Plausible numbers, not his (the gallery runs without data).
 */
import type { MeasureViewSpec } from "@lifeos/kit";
import { viewOf, type MeasureInput, type ViewRequest } from "@/core/engines/view";

const WEEK = ["lu", "ma", "me", "gi", "ve", "sa", "do"];
const week = (vs: number[]) => vs.map((v, i) => ({ d: WEEK[i]!, v }));

const WATER: MeasureInput = {
  name: "Acqua",
  reading: "amount",
  unit: "ml",
  v: 1750,
  plan: 500,
  refs: {
    target: 2500,
    zones: [
      { from: 0, level: "bad" },
      { from: 1500, level: "fair" },
      { from: 2300, level: "good" },
    ],
  },
  parts: [
    { name: "08:10", v: 500 },
    { name: "13:00", v: 750 },
    { name: "17:40", v: 500 },
  ],
  days: week([2100, 2600, 1800, 2450, 2900, 1500, 2250]),
};

const SESSION: MeasureInput = {
  name: "Serie allenanti",
  reading: "composition",
  v: 16,
  refs: {
    target: 18,
    zones: [
      { from: 0, level: "bad" },
      { from: 10, level: "fair" },
      { from: 15, level: "good" },
      { from: 24, level: "fair" },
    ],
  },
  parts: [
    { name: "Squat", short: "Squat", v: 5, color: "var(--muscle-legs)" },
    { name: "Stacco rumeno", short: "RDL", v: 4, color: "var(--muscle-back)" },
    { name: "Affondi", short: "Aff.", v: 4, color: "var(--muscle-legs)" },
    { name: "Polpacci", short: "Polp.", v: 3, color: "var(--muscle-core)" },
  ],
  // a day without a session has no value, not a zero (PRD-22)
  days: week([16, 0, 14, 0, 18, 12, 0]).filter((d) => d.v > 0),
};

const SESSION_VOTO: MeasureInput = {
  name: "Voto della sessione",
  reading: "score",
  v: 74,
  parts: [
    { name: "volume", v: 32, max: 40 },
    { name: "intensità", v: 24, max: 30 },
    { name: "costanza", v: 18, max: 30 },
  ],
  days: week([74, 0, 61, 0, 80, 55, 0]).filter((d) => d.v > 0),
};

const SLEEP: MeasureInput = {
  name: "Sonno",
  reading: "time",
  unit: "h",
  v: 6.6,
  refs: {
    target: 8,
    zones: [
      { from: 0, level: "bad" },
      { from: 6, level: "fair" },
      { from: 7, level: "good" },
      { from: 9, level: "fair" },
    ],
  },
  days: week([7.2, 6.1, 7.8, 6.6, 8.3, 9.1, 7.4]),
};

const SLEEP_GAP: MeasureInput = {
  ...SLEEP,
  name: "Sonno, notte senza dati",
  coverage: { have: 0, need: 1, missing: ["la notte di ieri"] },
};

// Yes / no (bars-study §19.1): creatine is a fixed dose, taken or not; a habit; a goal «n volte».
type S = "done" | "planned" | "skipped" | "missed";
const days = (ss: S[]) => ss.map((s, i) => ({ d: WEEK[i]!, s }));
const CREATINA: MeasureInput = {
  name: "Creatina",
  reading: "done",
  v: 1,
  color: "var(--macro-protein)",
  states: days(["done", "done", "missed", "done", "done", "done", "planned"]),
};
// November 2026 to the 20th: the 1st is a Sunday (lead 6).
const NOV: S[] = "ddmdddddmddsdddddddd"
  .split("")
  .map((c) => (c === "d" ? "done" : c === "s" ? "skipped" : "missed"));
const CREATINA_MESE: MeasureInput = {
  ...CREATINA,
  states: NOV.map((s, i) => ({ d: String(i + 1), s })),
  lead: 6,
};
const STRETCHING: MeasureInput = {
  name: "Stretching",
  reading: "done",
  v: null,
  state: "skipped",
  color: "var(--muscle-core)",
  states: days(["done", "skipped", "missed", "done", "missed", "missed", "planned"]),
};
const PALESTRA: MeasureInput = {
  name: "Palestra 4 volte a settimana",
  reading: "done",
  v: null,
  refs: { target: 4 },
  color: "var(--muscle-legs)",
  states: days(["done", "missed", "done", "missed", "missed", "missed", "planned"]),
};

const req = (frame: ViewRequest["frame"], level: ViewRequest["level"]): ViewRequest => ({
  frame,
  level,
});

/** Each row: the class, what was asked, and the view the engine gave. */
export const ENGINE_SAMPLES: { cls: string; asked: string; view: MeasureViewSpec }[] = [
  { cls: "Assunzione", asked: "giorno · livello 0", view: viewOf(WATER, req("day", 0)) },
  { cls: "Assunzione", asked: "giorno · livello 1", view: viewOf(WATER, req("day", 1)) },
  { cls: "Assunzione", asked: "da solo · livello 1", view: viewOf(WATER, req("own", 1)) },
  { cls: "Assunzione", asked: "periodo", view: viewOf(WATER, req("period", 0)) },
  {
    cls: "Attività",
    asked: "sessione · livello 0",
    view: viewOf(SESSION, req("session", 0)),
  },
  {
    cls: "Attività",
    asked: "sessione · livello 1",
    view: viewOf(SESSION, req("session", 1)),
  },
  {
    cls: "Attività",
    asked: "voto · livello 0",
    view: viewOf(SESSION_VOTO, req("session", 0)),
  },
  {
    cls: "Attività",
    asked: "voto · livello 1",
    view: viewOf(SESSION_VOTO, req("session", 1)),
  },
  { cls: "Attività", asked: "periodo", view: viewOf(SESSION, req("period", 0)) },
  { cls: "Stato", asked: "giorno · livello 0", view: viewOf(SLEEP, req("day", 0)) },
  { cls: "Stato", asked: "periodo", view: viewOf(SLEEP, req("period", 0)) },
  { cls: "Stato", asked: "copertura bassa", view: viewOf(SLEEP_GAP, req("day", 0)) },
  { cls: "Assunzione, sì / no", asked: "giorno", view: viewOf(CREATINA, req("day", 0)) },
  {
    cls: "Assunzione, sì / no",
    asked: "settimana",
    view: viewOf(CREATINA, req("period", 0)),
  },
  {
    cls: "Assunzione, sì / no",
    asked: "mese",
    view: viewOf(CREATINA_MESE, req("period", 0)),
  },
  { cls: "Attività, sì / no", asked: "giorno", view: viewOf(STRETCHING, req("day", 0)) },
  {
    cls: "Attività, sì / no",
    asked: "settimana",
    view: viewOf(STRETCHING, req("period", 0)),
  },
  {
    cls: "Obiettivo, sì / no",
    asked: "settimana",
    view: viewOf(PALESTRA, req("period", 0)),
  },
];
