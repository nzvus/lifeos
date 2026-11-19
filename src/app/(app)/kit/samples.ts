/**
 * The gallery's samples on his own numbers (kept apart so the page stays under 800 lines):
 * the voto of the Porridge of 9 Nov and his water, his micros of 9 Nov, the same as form items.
 */
import {
  F,
  type BoxEntry,
  type RadarAxis,
  type SolidData,
  type FormItem,
  type MNode,
  type NutrientsData,
} from "@lifeos/kit";

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

/** Bars study §7: the measure tree on his 9 Nov — kcal → macros, Proteine → kinds, the voto →
 *  criteria, the micros by group; one row of days as an example (not his data, PRD-22). */
const z = (...e: [number, "bad" | "fair" | "good" | "danger"][]) =>
  e.map(([from, level]) => ({ from, level }));
export const TREE_KCAL: MNode = {
  name: "Energia",
  v: 3478,
  t: 2105,
  color: "var(--ink)",
  label: "3.478 / 2.105 kcal",
  zones: z([0, "bad"], [1580, "fair"], [1895, "good"], [2631, "fair"], [3160, "bad"]),
  children: {
    adds: true,
    nodes: [
      {
        name: "Proteine",
        short: "Prot",
        v: 722,
        color: "var(--macro-protein)",
        zones: z([0, "bad"], [252, "fair"], [484, "good"], [668, "fair"], [880, "bad"]),
      },
      {
        name: "Carboidrati",
        short: "Carb",
        v: 1772,
        color: "var(--macro-carbs)",
        zones: z([0, "fair"], [912, "good"], [1264, "fair"], [1600, "bad"]),
      },
      {
        name: "Grassi",
        short: "Gras",
        v: 877,
        color: "var(--macro-fat)",
        zones: z([0, "bad"], [315, "good"], [738, "fair"], [900, "bad"]),
      },
      {
        name: "Fibre",
        short: "Fib",
        v: 93,
        color: "var(--macro-fiber)",
        zones: z([0, "bad"], [42, "fair"], [58, "good"], [120, "fair"]),
      },
    ],
  },
};
export const TREE_PLANNED: MNode = {
  name: "Energia, giornata in corso",
  v: 1450,
  plan: 650,
  t: 2105,
  color: "var(--ink)",
  label: "1.450 → 2.100 / 2.105 kcal",
  zones: TREE_KCAL.zones!,
};
const shade = (c: string, p: number) => `color-mix(in srgb, ${c} ${p}%, var(--sheet))`;
export const TREE_PROTEIN: MNode = {
  name: "Proteine",
  v: 180.5,
  t: 168,
  color: "var(--macro-protein)",
  label: "180,5 / 168 g",
  zones: z([0, "bad"], [63, "fair"], [121, "good"], [167, "fair"], [220, "bad"]),
  children: {
    adds: true,
    nodes: [
      { name: "qualità alta", short: "alta", v: 96.2, color: "var(--macro-protein)" },
      {
        name: "qualità media",
        short: "media",
        v: 51.9,
        color: shade("var(--macro-protein)", 70),
      },
      {
        name: "qualità bassa",
        short: "bassa",
        v: 13.3,
        color: shade("var(--macro-protein)", 50),
      },
      {
        name: "senza stima",
        short: "?",
        v: 19.1,
        color: shade("var(--macro-protein)", 35),
      },
    ],
  },
};
const crit = (i: number) => `var(--crit-${i})`;
export const TREE_VOTO: MNode = {
  name: "Voto del pasto (Porridge)",
  v: 71,
  max: 100,
  color: "var(--heat-good)",
  label: "71",
  zones: z([0, "bad"], [40, "fair"], [70, "good"]),
  children: {
    adds: true,
    nodes: [
      {
        name: "densità di nutrienti",
        short: "dens.",
        v: 10,
        max: 39,
        color: crit(1),
        zones: z([0, "bad"], [15.6, "fair"], [27.3, "good"]),
      },
      {
        name: "limiti",
        short: "lim.",
        v: 26,
        max: 26,
        color: crit(2),
        zones: z([0, "bad"], [10.4, "fair"], [18.2, "good"]),
      },
      {
        name: "qualità dei carboidrati",
        short: "carb.",
        v: 11,
        max: 11,
        color: crit(3),
        zones: z([0, "bad"], [4.4, "fair"], [7.7, "good"]),
      },
      {
        name: "qualità dei grassi",
        short: "gras.",
        v: 9,
        max: 9,
        color: crit(4),
        zones: z([0, "bad"], [3.6, "fair"], [6.3, "good"]),
      },
      {
        name: "sazietà",
        short: "saz.",
        v: 8.9,
        max: 9,
        color: crit(5),
        zones: z([0, "bad"], [3.6, "fair"], [6.3, "good"]),
      },
      {
        name: "varietà",
        short: "var.",
        v: 6,
        max: 6,
        color: crit(6),
        zones: z([0, "bad"], [2.4, "fair"], [4.2, "good"]),
      },
    ],
  },
};
/** Minerals by their symbol, so a column's label fits (style samples, bars study §9). */
const SYMBOL: Record<string, string> = {
  Calcio: "Ca",
  Sodio: "Na",
  Selenio: "Se",
  Ferro: "Fe",
  Magnesio: "Mg",
  Potassio: "K",
  Iodio: "I",
  Zinco: "Zn",
  Fosforo: "P",
  Rame: "Cu",
};
const cells = (
  gi: number,
  g: NonNullable<NutrientsData["micros"]>["groups"][number],
): MNode[] =>
  g.items.map((i, ii) => ({
    name: i.name,
    short: SYMBOL[i.name] ?? (i.name.length > 4 ? i.name.slice(0, 3) : i.name),
    v: i.v,
    t: i.t ?? i.v,
    unit: i.unit,
    zones: i.zones ?? zonesTo(i.t ?? i.v),
    color: shade(crit(gi + 1), Math.round(100 - (ii / g.items.length) * 45)),
  }));
export const TREE_MICROS: MNode[] = (MICROS_9NOV.micros?.groups ?? []).map((g, gi) => {
  const kids = cells(gi, g);
  const ok = kids.filter((k) => {
    const lv =
      k.zones && k.zones.length
        ? k.zones.filter((zz) => zz.from <= k.v).pop()?.level
        : "good";
    return lv === "good";
  }).length;
  const share = Math.round((ok / kids.length) * 100);
  return {
    name: g.name,
    v: share,
    max: 100,
    color: crit(gi + 1),
    label: `${ok} su ${kids.length} a posto`,
    zones: z([0, "bad"], [50, "fair"], [80, "good"]),
    children: { adds: false, nodes: kids },
  };
});
/** An example, not his data (PRD-22): seven days of kcal against 2.105, today with a plan. */
export const DAYS_EXAMPLE = {
  name: "Energia, 7 giorni (esempio)",
  t: 2105,
  zones: TREE_KCAL.zones!,
  color: "var(--ink)",
  label: "media 2.320 kcal",
  days: [
    { d: "M", v: 2050 },
    { d: "M", v: 2410 },
    { d: "G", v: 1980 },
    { d: "V", v: 2890 },
    { d: "S", v: 2200 },
    { d: "D", v: 3478 },
    { d: "L", v: 1450, plan: 650 },
  ],
};

/** Shapes (bars study §13): his 9 Nov as «Il giorno» showed it on 14 Nov (photos his-day/). */
type Lv = "bad" | "fair" | "good" | "danger";
const rg = (...e: [number, Lv][]) => e.map(([from, level]) => ({ from, level }));
const ax = (
  key: string,
  name: string,
  v: number,
  t: number,
  color: string,
  ranges: { from: number; level: Lv }[],
  unit: string,
): RadarAxis => ({
  key,
  name,
  v,
  t,
  color,
  ranges,
  label: F.num(v, unit) + " / " + F.num(t, unit),
});
export const RADAR_9NOV: RadarAxis[] = [
  ax(
    "kcal",
    "Energia",
    3478,
    2105,
    "var(--ink)",
    rg([0, "bad"], [1580, "fair"], [1895, "good"], [2631, "fair"], [3160, "bad"]),
    "kcal",
  ),
  ax(
    "protein",
    "Proteine",
    180.5,
    168,
    "var(--macro-protein)",
    rg([0, "bad"], [63, "fair"], [121, "good"], [167, "fair"], [220, "bad"]),
    "g",
  ),
  ax(
    "carbs",
    "Carboidrati",
    442.9,
    221,
    "var(--macro-carbs)",
    rg([0, "fair"], [228, "good"], [316, "fair"], [400, "bad"]),
    "g",
  ),
  ax(
    "fat",
    "Grassi",
    97.5,
    61,
    "var(--macro-fat)",
    rg([0, "bad"], [35, "good"], [82, "fair"], [100, "bad"]),
    "g",
  ),
  ax(
    "fiber",
    "Fibre",
    46.7,
    29,
    "var(--macro-fiber)",
    rg([0, "bad"], [21, "fair"], [29, "good"], [60, "fair"]),
    "g",
  ),
];
/** His five meals of 9 Nov, each macro in kcal (P × 4, C × 4, G × 9, F × 2), from the meal boxes. */
const MEALS_9NOV: [string, string, number[]][] = [
  ["Colazione 06:54", "breakfast", [6, 40, 2, 0]],
  ["Colazione 10:04", "breakfast", [45, 81, 25, 16]],
  ["Pranzo 12:19", "lunch", [20, 76, 6, 4]],
  ["Spuntino 18:11", "snack", [89, 204, 50, 22]],
  ["Cena 22:43", "dinner", [20, 43, 14, 4]],
];
const KCAL_PER_G = [4, 4, 9, 2];
export const SOLID_9NOV: SolidData = {
  label: "Il 9 novembre, kcal per pasto e per macro",
  cols: MEALS_9NOV.map(([name, sub]) => ({ name, icon: { fam: "food", sub } })),
  rows: [
    { name: "Proteine", key: "protein", color: "var(--macro-protein)" },
    { name: "Carboidrati", key: "carbs", color: "var(--macro-carbs)" },
    { name: "Grassi", key: "fat", color: "var(--macro-fat)" },
    { name: "Fibre", key: "fiber", color: "var(--macro-fiber)" },
  ],
  v: KCAL_PER_G.map((k, r) => MEALS_9NOV.map(([, , g]) => g[r]! * k)),
};
export const SOLID_VIEWS = ["di tre quarti", "per pasto", "per macro", "dall'alto"];
