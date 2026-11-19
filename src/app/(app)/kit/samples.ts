/**
 * The gallery's samples on his own numbers (kept apart so the page stays under 800 lines):
 * the voto of the Porridge of 9 Nov and his water, his micros of 9 Nov, the same as form items.
 */
import {
  F,
  type BoxEntry,
  type DrillRange,
  type DrillRow,
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

/** Drill proposals (bars study §12): his 9 Nov as «Il giorno» shows it (photos of 14 Nov). */
type R = DrillRange["level"];
const rg = (...e: [number, R][]): DrillRange[] =>
  e.map(([from, level]) => ({ from, level, name: RANGE_WORD[level] }));
const RANGE_WORD: Record<R, string> = {
  danger: "da evitare",
  bad: "pessimo",
  fair: "ok",
  good: "ottimo",
};
export const DRILL_LEGEND = (["bad", "fair", "good"] as const).map((level) => ({
  level,
  name: RANGE_WORD[level],
}));
const wordOf = (v: number, ranges: DrillRange[]) =>
  ranges.filter((r) => r.from <= v).pop()?.name ?? "";
const row = (r: Omit<DrillRow, "word">): DrillRow => ({
  ...r,
  ...(r.ranges ? { word: wordOf(r.v + (r.plan ?? 0), r.ranges) } : {}),
});
export const DRILL_ENERGY = row({
  name: "Energia",
  v: 3478,
  t: 2105,
  color: "var(--ink)",
  ranges: rg([0, "bad"], [1580, "fair"], [1895, "good"], [2631, "fair"], [3160, "bad"]),
  opens: true,
});
export const DRILL_MACROS: DrillRow[] = [
  row({
    name: "Proteine",
    v: 180.5,
    t: 168,
    color: "var(--macro-protein)",
    ranges: rg([0, "bad"], [63, "fair"], [121, "good"], [167, "fair"], [220, "bad"]),
    opens: true,
  }),
  row({
    name: "Carboidrati",
    v: 442.9,
    t: 221,
    color: "var(--macro-carbs)",
    ranges: rg([0, "fair"], [228, "good"], [316, "fair"], [400, "bad"]),
    opens: true,
  }),
  row({
    name: "Grassi",
    v: 97.5,
    t: 61,
    color: "var(--macro-fat)",
    ranges: rg([0, "bad"], [35, "good"], [82, "fair"], [100, "bad"]),
    opens: true,
  }),
  row({
    name: "Fibre",
    v: 46.7,
    t: 29,
    color: "var(--macro-fiber)",
    ranges: rg([0, "bad"], [21, "fair"], [29, "good"], [60, "fair"]),
    opens: true,
  }),
];
const g1 = (v: number) => F.num(v, "g");
/** B · level 0: every row as a share of its target, so one axis serves them all. */
export const DRILL_SHARE: DrillRow[] = [DRILL_ENERGY, ...DRILL_MACROS].map((r) => {
  const k = 100 / r.t!;
  return {
    ...r,
    v: r.v * k,
    t: 100,
    label: r === DRILL_ENERGY ? F.num(r.v, "kcal") : g1(r.v),
    ranges: r.ranges!.map((x) => ({ ...x, from: x.from * k })),
  };
});
const P = "var(--macro-protein)";
const pshade = (p: number) => `color-mix(in srgb, ${P} ${p}%, var(--sheet))`;
export const DRILL_KINDS: DrillRow[] = [
  { name: "qualità alta", v: 96.2, color: P },
  { name: "qualità media", v: 51.9, color: pshade(70) },
  { name: "qualità bassa", v: 13.3, color: pshade(50) },
  { name: "senza stima", v: 19.1, color: pshade(35) },
].map((r) => ({ ...r, label: g1(r.v) }));
export const DRILL_FOODS: DrillRow[] = [
  { name: "Latte scremato", v: 82 },
  { name: "Fiocchi d'avena", v: 20.3 },
  { name: "Mozzarella proteica", v: 14 },
  { name: "Burro di arachidi", v: 12.9 },
  { name: "Gnocchi di patate", v: 12 },
  { name: "e altri 12", v: 39.3 },
].map((r) => ({
  ...r,
  color: P,
  label: g1(r.v) + " · " + F.n((r.v / 180.5) * 100, 0) + " %",
}));
/** C · the pivot: the same 3.478 kcal by macro, by meal, by part of the day. */
const total: DrillRow = { ...DRILL_ENERGY, opens: false };
const kc = (name: string, v: number, color: string): DrillRow => ({ name, v, color });
export const DRILL_PIVOT: [string, DrillRow[]][] = [
  [
    "per macro",
    [
      total,
      kc("Proteine", 722, "var(--macro-protein)"),
      kc("Carboidrati", 1772, "var(--macro-carbs)"),
      kc("Grassi", 877, "var(--macro-fat)"),
      kc("Fibre", 93, "var(--macro-fiber)"),
    ],
  ],
  [
    "per pasto",
    [
      total,
      kc("Preworkout", 202, "var(--crit-1)"),
      kc("Colazione", 774, "var(--crit-2)"),
      kc("Pranzo", 445, "var(--crit-3)"),
      kc("Spuntino", 1677, "var(--crit-4)"),
      kc("Cena", 380, "var(--crit-5)"),
    ],
  ],
  [
    "per momento",
    [
      total,
      kc("Mattina", 976, "var(--crit-1)"),
      kc("Mezzogiorno", 445, "var(--crit-3)"),
      kc("Pomeriggio", 1677, "var(--crit-4)"),
      kc("Sera", 380, "var(--crit-5)"),
    ],
  ],
];
