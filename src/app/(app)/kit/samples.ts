/**
 * The gallery's samples on his own numbers (kept apart so the page stays under 800 lines):
 * the voto of the Porridge of 9 Nov and his water, his micros of 9 Nov, the same as form items.
 */
import type { BoxEntry, FormItem, NutrientsData } from "@lifeos/kit";

/** His numbers for the opened voto: the Porridge of 9 Nov (71), his water that day (80). */
export const VOTO_SAMPLES: [string, string, BoxEntry][] = [
  [
    "pasto",
    "Un pasto (Porridge, 9 nov)",
    {
      fam: "food",
      of: { kind: "meal" },
      title: "Porridge proteico",
      value: "533 kcal",
      score: {
        value: 71,
        parts: [
          { name: "densità di nutrienti", score: 0.26, weight: 0.39 },
          { name: "limiti", score: 1, weight: 0.26 },
          { name: "qualità dei carboidrati", score: 1, weight: 0.11 },
          { name: "qualità dei grassi", score: 1, weight: 0.09 },
          { name: "sazietà", score: 0.99, weight: 0.09 },
          { name: "varietà", score: 1, weight: 0.06 },
        ],
        missing: [
          "valore (manca il prezzo)",
          "adatto al piano (non è un pasto del piano)",
          "momento (conta vicino all'allenamento o al sonno)",
        ],
        how: "/oggi/andamento/come-valutiamo?modello=food",
      },
    },
  ],
  [
    "acqua",
    "L'acqua del giorno",
    {
      fam: "drink",
      sub: "water",
      title: "Acqua",
      value: "3 / 2,9 l",
      score: {
        value: 80,
        parts: [
          { name: "bevuta vs attesa a quest’ora", score: 1, weight: 0.5 },
          { name: "dopo l’allenamento", score: 1, weight: 0.3 },
          { name: "distribuita nel giorno", score: 0, weight: 0.2 },
        ],
        missing: [],
        how: "/oggi/andamento/come-valutiamo?modello=water",
      },
    },
  ],
  [
    "previsto",
    "Un pasto previsto (tratteggiato)",
    {
      fam: "food",
      of: { kind: "meal" },
      title: "Cena prevista",
      value: "650 kcal",
      planned: true,
      score: {
        value: 58,
        parts: [
          { name: "densità di nutrienti", score: 0.45, weight: 0.39 },
          { name: "limiti", score: 0.6, weight: 0.26 },
          { name: "qualità dei carboidrati", score: 0.8, weight: 0.11 },
          { name: "qualità dei grassi", score: 0.7, weight: 0.09 },
          { name: "sazietà", score: 0.9, weight: 0.09 },
          { name: "varietà", score: 1, weight: 0.06 },
        ],
        missing: [],
        how: "/oggi/andamento/come-valutiamo?modello=food",
      },
    },
  ],
];

/** His micros of 9 Nov (the photo of 19 Nov): what was low, high, and fine. */
const zonesTo = (t: number, ul?: number) => [
  { from: 0, level: "bad" as const },
  { from: t * 0.7, level: "fair" as const },
  { from: t, level: "good" as const },
  ...(ul ? [{ from: ul, level: "danger" as const }] : []),
];
export const MICROS_9NOV: NutrientsData = {
  macros: [],
  micros: {
    summary: "6 su 11 coperti · stime",
    groups: [
      {
        name: "Vitamine",
        items: [
          {
            name: "C",
            v: 80,
            t: 110,
            unit: "mg",
            state: "warn",
            zones: zonesTo(110, 2000),
          },
          { name: "D", v: 1.2, t: 15, unit: "µg", state: "bad", zones: zonesTo(15, 100) },
          { name: "B12", v: 6.1, t: 4, unit: "µg", state: "good", zones: zonesTo(4) },
          {
            name: "Folati",
            v: 420,
            t: 330,
            unit: "µg",
            state: "good",
            zones: zonesTo(330, 1000),
          },
        ],
      },
      {
        name: "Minerali",
        items: [
          {
            name: "Calcio",
            v: 2761,
            t: 1000,
            unit: "mg",
            state: "bad",
            zones: zonesTo(1000, 2500),
          },
          {
            name: "Sodio",
            v: 2586,
            t: 2000,
            unit: "mg",
            state: "warn",
            zones: [
              { from: 0, level: "good" as const },
              { from: 2000, level: "fair" as const },
              { from: 3000, level: "bad" as const },
            ],
          },
          {
            name: "Selenio",
            v: 64,
            t: 70,
            unit: "µg",
            state: "warn",
            zones: zonesTo(70, 300),
          },
          { name: "Ferro", v: 19, t: 11, unit: "mg", state: "good", zones: zonesTo(11) },
          {
            name: "Magnesio",
            v: 520,
            t: 350,
            unit: "mg",
            state: "good",
            zones: zonesTo(350),
          },
          {
            name: "Potassio",
            v: 4100,
            t: 3500,
            unit: "mg",
            state: "good",
            zones: zonesTo(3500),
          },
          {
            name: "Iodio",
            v: 160,
            t: 150,
            unit: "µg",
            state: "good",
            zones: zonesTo(150, 600),
          },
        ],
      },
      {
        name: "Altro",
        items: [
          {
            name: "Caffeina",
            v: 190,
            t: 400,
            unit: "mg",
            state: "good",
            // less is better: fine up to 400 mg (FD-62)
            zones: [
              { from: 0, level: "good" as const },
              { from: 400, level: "fair" as const },
              { from: 600, level: "bad" as const },
            ],
          },
          { name: "Creatina", v: 5, t: 5, unit: "g", state: "good" },
        ],
      },
    ],
  },
};

/** His micros of 9 Nov as form items: each in its group's colour, lighter for each next one. */
export const FORM_ITEMS: FormItem[] = (MICROS_9NOV.micros?.groups ?? []).flatMap(
  (g, gi) =>
    g.items.map((i, ii) => ({
      name: i.name,
      v: i.v,
      t: i.t ?? i.v,
      unit: i.unit,
      zones: i.zones ?? zonesTo(i.t ?? i.v),
      color: `color-mix(in srgb, var(--crit-${gi + 1}) ${Math.round(100 - (ii / g.items.length) * 55)}%, var(--sheet))`,
    })),
);
