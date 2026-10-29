/**
 * features/day/nutrients.ts — the day as a Box (V-01, kit.md §5): its
 * meals added up (core/food `dayFood`) against the targets in force
 * (core/day `readDayTargets`), as the kit's Nutrients L1 data, and the
 * Box's line saying where the targets come from. Every bar carries its
 * zones (E5 ranges, dossiers/ranges.md): the energy they scale with is the
 * day's target, else what the day holds; free sugars when the kinds tell
 * them apart, else the total without zones (the ranges are for free ones).
 * Pure: tested without a browser.
 */
import {
  F,
  type BoxEntry,
  type MacroKey,
  type NutrientsData,
  type State,
} from "@lifeos/kit";
import type { Day, DayItem, FoodTargets } from "@/core/day";
import {
  inulinRange,
  omega3Range,
  omega6Range,
  transRange,
  caffeineDayRange,
  carbsRange,
  fatRange,
  fibreRange,
  microRange,
  microState,
  proteinRange,
  saltRange,
  saturatedRange,
  sugarsRange,
  type DayBasis,
  type Micro,
  type MicroTarget,
  type Range,
} from "@/core/engines/targets";
import { dayFood, type FoodEntry } from "@/core/food/day";
import { macroKinds } from "@/core/food/kinds";
import { dayMicros } from "@/core/food/micros";
import { lineTotals } from "@/core/food/totals";
import { mealCompounds } from "@/core/food/compounds";
import { isEaten } from "@/core/kinds";

/** The kit's macro → the field the snapshot and the targets use. */
const MACROS: [MacroKey, "protein" | "carbs" | "fat" | "fibre"][] = [
  ["protein", "protein"],
  ["carbs", "carbs"],
  ["fat", "fat"],
  ["fiber", "fibre"],
];

const food = (
  i: DayItem,
  estimates: ReadonlyMap<string, Record<string, string>>,
): FoodEntry => ({
  status: i.status,
  leftOut: i.values["leftOut"] === true,
  servings: typeof i.values["servings"] === "string" ? i.values["servings"] : null,
  lines: i.lines.map((l) => {
    const k = l.itemId ? estimates.get(l.itemId) : undefined;
    return k ? { ...l, estimates: k } : l;
  }),
});

export function presentDay(
  day: Day,
  targets: FoodTargets | null,
  /** Each food's estimates (core/food `readFoodEstimates`); without them no kinds, no micros. */
  estimates: ReadonlyMap<string, Record<string, string>> = new Map(),
  /** E5's EFSA targets for this person; null while their sex or age is unknown. */
  microTargets: readonly MicroTarget[] | null = null,
  /** The reference weight for the zones (the last 7 days' weigh-ins); null when none. */
  weightKg: number | null = null,
): { entry: BoxEntry; nutrients: NutrientsData } | null {
  const meals = [...day.timed, ...day.untimed].filter((i) => isEaten(i.kind.key));
  if (meals.length === 0 && targets === null) return null;
  const {
    eaten,
    planned,
    sources,
    kinds: split,
  } = dayFood(meals.map((m) => food(m, estimates)));
  const eatenMicros = dayMicros(
    meals.filter((m) => m.status === "done").map((m) => food(m, estimates)),
  );
  const v = (r: Record<string, string>, f: string) => Number(r[f] ?? 0);
  const kcal = targets?.kcal ?? v(eaten, "kcal") + v(planned, "kcal");
  const basis: DayBasis | null = kcal > 0 ? { weightKg, kcal } : null;
  const zones = (r: (b: DayBasis) => Range) => (basis ? { zones: r(basis).zones } : {});
  const RANGE = {
    protein: proteinRange,
    carbs: carbsRange,
    fat: fatRange,
    fibre: fibreRange,
  };
  const free = estimates.size > 0 ? (split["carbs"]?.["free"] ?? 0) : undefined;
  const limits: NonNullable<NutrientsData["limits"]> = basis
    ? [
        free !== undefined
          ? {
              key: "sugars",
              name: "Zuccheri liberi",
              v: free,
              t: (basis.kcal * 0.1) / 4,
              ...zones(sugarsRange),
            }
          : {
              key: "sugars",
              v: v(eaten, "sugars"),
              planned: v(planned, "sugars"),
              t: targets?.sugars ?? (kcal * 45) / 1000,
            },
        {
          key: "sat",
          v: v(eaten, "saturatedFat"),
          planned: v(planned, "saturatedFat"),
          t: targets?.saturatedFat ?? (basis.kcal * 0.1) / 9,
          ...zones(saturatedRange),
        },
        {
          key: "salt",
          v: v(eaten, "salt"),
          planned: v(planned, "salt"),
          t: targets?.salt ?? 5,
          zones: saltRange().zones,
        },
      ]
    : [];
  return {
    entry: {
      fam: "day",
      title: "Il giorno",
      meta: targetWords(targets),
    },
    nutrients: {
      kcal: {
        v: v(eaten, "kcal"),
        planned: v(planned, "kcal"),
        t: targets?.kcal ?? null,
      },
      macros: MACROS.map(([key, f]) => ({
        key,
        v: v(eaten, f),
        planned: v(planned, f),
        t: targets?.[f] ?? null,
        sources: (sources[f] ?? []).map((s): [string, number] => [
          s.name,
          Number(s.amount),
        ]),
        ...(estimates.size > 0 ? { parts: split[f] } : {}),
        ...zones(RANGE[f]),
        ...(basis && estimates.size > 0 ? { partZones: kindZones(f, basis) } : {}),
      })),
      ...(estimates.size > 0
        ? { micros: withOthers(microsOf(eatenMicros, microTargets), meals, estimates) }
        : {}),
      limits,
    },
  };
}

/**
 * Where the day's targets come from, in words (dossiers/targets.md §5: every
 * number traceable): «dispendio ≈ 2.533 ± 224 kcal − 322 per il ritmo
 * dell'obiettivo (−0,5 %/sett.) · modello «Rec»».
 */
export function targetWords(t: FoodTargets | null): string {
  if (t === null)
    return "obiettivi da calcolare: servono pesate e sesso, anno e altezza nelle impostazioni";
  if (t.from === "day") return "obiettivi fissati per questo giorno";
  const model = t.basis?.model ? "modello «" + t.basis.model + "»" : "";
  if (t.from === "model") return model + ": numeri fissi";
  const b = t.basis;
  if (!b?.expenditureKcal) return "obiettivi della settimana dal " + F.date(t.since);
  const deficit = b.deficitKcal ?? 0;
  const why =
    deficit === 0
      ? ""
      : (deficit > 0 ? " − " : " + ") +
        F.num(Math.abs(deficit), "kcal") +
        (b.deficitFrom === "goal"
          ? " per il ritmo dell'obiettivo" +
            (b.ratePctWeek != null ? " (" + F.n(b.ratePctWeek, 2) + " %/sett.)" : "")
          : " del modello");
  return (
    "dispendio " +
    F.approx(b.expenditureKcal, "kcal") +
    (b.sigmaKcal ? " ± " + F.num(b.sigmaKcal, "") : "") +
    why +
    (b.floored ? " · non sotto il metabolismo basale" : "") +
    (model ? " · " + model : "") +
    " · dal " +
    F.date(t.since)
  );
}

/**
 * The kinds a guideline speaks of (dossiers/ranges.md): free sugars, saturated
 * and trans fat, omega-3 and omega-6, inulin/FOS. The others (protein
 * quality, whole or refined starch, MUFA, other fibres) have no line to judge
 * against: they stay unjudged rather than invented.
 */
function kindZones(f: "protein" | "carbs" | "fat" | "fibre", b: DayBasis) {
  const z = (r: Range) => r.zones;
  if (f === "carbs") return { free: z(sugarsRange(b)) };
  if (f === "fat")
    return {
      sfa: z(saturatedRange(b)),
      trans: z(transRange(b)),
      n3: z(omega3Range(b)),
      pufa6: z(omega6Range(b)),
    };
  if (f === "fibre") return { inulin: z(inulinRange()) };
  return {};
}

/**
 * «Altro» under the micros (dossiers/ranges.md §6): the day's caffeine
 * against 400 mg with its zones (EFSA 2015), creatine against 3 g (ISSN:
 * 3–5 g a day; what counts is days taken, said on its box).
 */
function withOthers(
  m: NonNullable<NutrientsData["micros"]>,
  meals: readonly DayItem[],
  estimates: ReadonlyMap<string, Record<string, string>>,
): NonNullable<NutrientsData["micros"]> {
  const sum = { caffeine: 0, creatine: 0 };
  for (const i of meals.filter((x) => x.status === "done")) {
    const servings =
      typeof i.values["servings"] === "string" ? i.values["servings"] : null;
    const c = mealCompounds(i.lines, servings, estimates);
    sum.caffeine += c.caffeine;
    sum.creatine += c.creatine;
  }
  const items: MicroItem[] = [
    ...(sum.caffeine > 0
      ? [
          {
            name: "Caffeina",
            v: sum.caffeine,
            t: 400,
            unit: "mg",
            zones: caffeineDayRange().zones,
          },
        ]
      : []),
    ...(sum.creatine > 0
      ? [
          {
            name: "Creatina",
            v: sum.creatine,
            t: 3,
            unit: "g",
            state: (sum.creatine >= 3 ? "good" : "warn") as State,
          },
        ]
      : []),
  ];
  return items.length ? { ...m, groups: [...m.groups, { name: "Altro", items }] } : m;
}

/**
 * A meal's leucine, estimated from its protein's quality (no food carries it
 * yet): ≈ 9 % of high-quality protein (dairy, eggs, meat), 8 % medium, 6.5 %
 * low (most plants), 7.5 % unknown (Norton 2009; van Vliet 2015). ISSN 2017:
 * ≈ 2.5 g a meal makes the most of muscle protein synthesis; from 1.5 g «ok».
 */
const LEUCINE_SHARE: Record<string, number> = {
  high: 0.09,
  medium: 0.08,
  low: 0.065,
  none: 0.075,
};
function leucineNote(parts: Record<string, number> | undefined) {
  const g = Object.entries(parts ?? {}).reduce(
    (a, [k, v]) => a + v * (LEUCINE_SHARE[k] ?? 0.075),
    0,
  );
  if (g < 0.3) return {};
  // Judged as it is shown, to one decimal: «≈ 2,5 g» is ideal.
  const r = Math.round(g * 10) / 10;
  const state: State = r >= 2.5 ? "good" : r >= 1.5 ? "warn" : "bad";
  return {
    extras: [{ t: "leucina " + F.approx(g, "g") + " (stima, 2,5 g ideale)", state }],
  };
}

/** A meal's protein (ISSN 2017): 0.25–0.4 g/kg makes the most of a meal; less is only «ok». */
const mealProteinZones = (weightKg: number | null) =>
  weightKg === null
    ? {}
    : {
        zones: [
          { from: 0, level: "fair" as const },
          { from: 0.25 * weightKg, level: "good" as const },
        ],
      };

/**
 * A meal's carbs' glycaemic load, estimated from their kinds (no food carries
 * its GI yet): whole starch ≈ 50, refined starch and tubers ≈ 70, fruit and
 * milk sugars ≈ 40, free sugars ≈ 65, unknown 60 (Atkinson 2008, the
 * international GI tables). A meal's GL ≤ 10 is low, 11–19 medium, ≥ 20 high.
 */
const GI: Record<string, number> = { whole: 50, refined: 70, intrinsic: 40, free: 65 };
function carbsNote(parts: Record<string, number> | undefined) {
  const p = parts ?? {};
  const all = Object.values(p).reduce((a, v) => a + v, 0);
  if (all < 5) return {};
  const gl = Object.entries(p).reduce((a, [k, v]) => a + (v * (GI[k] ?? 60)) / 100, 0);
  const r = Math.round(gl);
  const state: State = r <= 10 ? "good" : r < 20 ? "warn" : "bad";
  const free = p["free"] ?? 0;
  return {
    extras: [
      { t: "carico glicemico " + F.approx(r, "") + " (stima)", state },
      ...(free >= 0.5 ? [{ t: "zuccheri liberi " + F.num(free, "g") }] : []),
    ],
  };
}

/** A meal's omega-3, and the food most of it came from when one did. */
function fatNote(foods: NonNullable<NutrientsData["foods"]>, all: number) {
  if (all < 0.1) return {};
  const top = foods
    .map((f) => [f.name, f.macros.fat?.["n3"] ?? 0] as const)
    .sort((a, b) => b[1] - a[1])[0];
  const most =
    foods.length > 1 && top && top[1] / all >= 0.6 ? ", per lo più da " + top[0] : "";
  return { extras: [{ t: "omega-3 " + F.num(all, "g") + most }] };
}

/** Inulin is well tolerated in steps (ranges.md: up to ≈ 10 g a day); most of a meal's fibre from it says so. */
function fibreNote(parts: Record<string, number> | undefined) {
  const p = parts ?? {};
  const all = Object.values(p).reduce((a, v) => a + v, 0);
  const inulin = p["inulin"] ?? 0;
  return inulin >= 3 && inulin / all >= 0.5
    ? {
        extras: [
          {
            t: "l’inulina è quasi tutta la fibra: meglio a dosi graduali",
            state: "warn" as State,
          },
        ],
      }
    : {};
}

/**
 * A meal's foods for its window (L2): each line with its grams per macro and
 * kind. Without any estimate the kinds are unknown: each macro is one piece
 * («all», which the kit draws in the macro's own colour).
 */
function mealFoods(
  meal: DayItem,
  estimates: ReadonlyMap<string, Record<string, string>>,
): NonNullable<NutrientsData["foods"]> {
  const servings = servingsOf(meal);
  return meal.lines.map((l) => {
    const est = l.itemId ? estimates.get(l.itemId) : undefined;
    const k = macroKinds([{ ...l, ...(est ? { estimates: est } : {}) }], servings);
    const whole = (m: Record<string, number>) =>
      estimates.size > 0 ? m : { all: Object.values(m).reduce((a, v) => a + v, 0) };
    const kcal = Number(lineTotals([l], servings)["kcal"] ?? 0);
    return {
      key: l.id,
      name: l.name || "Senza nome",
      amount:
        F.num(Number(l.quantity) * Number(servings ?? "1"), l.unit) +
        (kcal > 0 ? " · " + F.n(kcal, 0) + " kcal" : ""),
      kcal,
      macros: {
        protein: whole(k.protein),
        carbs: whole(k.carbs),
        fat: whole(k.fat),
        fiber: whole(k.fibre),
      },
    };
  });
}

/**
 * A meal's micros: what it brought next to what the whole day needs, not
 * judged (a meal is not meant to cover the day).
 */
function mealMicros(
  meal: DayItem,
  estimates: ReadonlyMap<string, Record<string, string>>,
  targets: readonly MicroTarget[] | null,
): NutrientsData["micros"] | undefined {
  if (estimates.size === 0) return undefined;
  const m = microsOf(dayMicros([food(meal, estimates)]), targets);
  if (m.groups.length === 0) return undefined;
  return {
    summary: targets ? "stime · su quanto serve al giorno" : m.summary,
    groups: m.groups.map((g) => ({
      name: g.name,
      items: g.items.map(({ name, v, t, unit }) => ({ name, v, t, unit })),
    })),
  };
}

/**
 * A meal's nutrients: its thin macro bars (L0), and its window when its box
 * opens (L2: its foods, kcal, kinds, where each came from, notes, micros). What it brought (or will
 * bring, when planned), split into kinds, against the day's targets — a slot's targets
 * come with day templates (E5 `slotTargets`); without day targets the bars
 * share one scale. Null for a meal with nothing to show (a coffee).
 */
export function mealL0(
  meal: DayItem,
  targets: FoodTargets | null,
  estimates: ReadonlyMap<string, Record<string, string>> = new Map(),
  /** The reference weight: the protein's zones per meal; null leaves them out. */
  weightKg: number | null = null,
  /** E5's micro targets: the day's need next to each of the meal's micros. */
  microTargets: readonly MicroTarget[] | null = null,
): NutrientsData | null {
  if (meal.kind.key !== "meal") return null;
  const v = (f: string) => Number(lineTotals(meal.lines, servingsOf(meal))[f] ?? 0);
  if (MACROS.every(([, f]) => v(f) === 0)) return null;
  // The meal's own kinds, eaten or planned (dayFood's are only what was eaten).
  const kinds = macroKinds(
    meal.lines.map((l) => {
      const est = l.itemId ? estimates.get(l.itemId) : undefined;
      return est ? { ...l, estimates: est } : l;
    }),
    servingsOf(meal),
  );
  const foods = mealFoods(meal, estimates);
  const known = estimates.size > 0;
  const micros = mealMicros(meal, estimates, microTargets);
  const NOTE = {
    protein: () => leucineNote(kinds.protein),
    carbs: () => carbsNote(kinds.carbs),
    fat: () => fatNote(foods, kinds.fat["n3"] ?? 0),
    fibre: () => fibreNote(kinds.fibre),
  };
  return {
    foods,
    kcal: { v: v("kcal"), t: targets?.kcal ?? null },
    macros: MACROS.map(([key, f]) => ({
      key,
      v: v(f),
      t: targets?.[f] ?? null,
      ...(known ? { parts: kinds[f] } : {}),
      ...(key === "protein" ? mealProteinZones(weightKg) : {}),
      ...(known ? NOTE[f]() : {}),
    })),
    ...(micros ? { micros } : {}),
  };
}

const servingsOf = (i: DayItem) =>
  typeof i.values["servings"] === "string" ? i.values["servings"] : null;

/** The foods a day's meals were made of, for their kind estimates. */
export function foodIds(day: Day): string[] {
  return [...day.timed, ...day.untimed]
    .filter((i) => isEaten(i.kind.key))
    .flatMap((i) => i.lines.flatMap((l) => (l.itemId ? [l.itemId] : [])));
}

type MicroItem = NonNullable<NutrientsData["micros"]>["groups"][number]["items"][number];

const MICRO_GROUPS: [string, [Micro, string][]][] = [
  [
    "Vitamine",
    [
      ["vitA", "A"],
      ["vitC", "C"],
      ["vitD", "D"],
      ["b12", "B12"],
      ["folate", "Folati"],
    ],
  ],
  [
    "Minerali",
    [
      ["ca", "Calcio"],
      ["fe", "Ferro"],
      ["mg", "Magnesio"],
      ["k", "Potassio"],
      ["na", "Sodio"],
      ["i", "Iodio"],
      ["se", "Selenio"],
    ],
  ],
];
const MICRO_UNIT: Record<Micro, string> = {
  vitA: "µg",
  vitC: "mg",
  vitD: "µg",
  b12: "µg",
  folate: "µg",
  ca: "mg",
  fe: "mg",
  mg: "mg",
  k: "mg",
  na: "mg",
  i: "µg",
  se: "µg",
};

/**
 * The micros the eaten foods carried, against E5's targets: met is good;
 * short is warn from half the target, bad under it; over an upper level
 * that judges the whole day (or sodium's safe intake) is bad. Only micros
 * some food carried an estimate for are shown: no "0 of 750" from no data.
 */
export function microsOf(
  eaten: Partial<Record<Micro, number>>,
  targets: readonly MicroTarget[] | null,
): NonNullable<NutrientsData["micros"]> {
  const by = new Map((targets ?? []).map((t) => [t.micro, t]));
  let met = 0;
  let judged = 0;
  const groups = MICRO_GROUPS.map(([name, list]) => ({
    name,
    items: list.flatMap(([m, label]): MicroItem[] => {
      const v = eaten[m];
      if (v === undefined) return [];
      const t = by.get(m);
      if (!t) return [{ name: label, v, t: null, unit: MICRO_UNIT[m] }];
      const s = microState(v, t);
      judged++;
      if (s === "met") met++;
      const state: State =
        s === "met" ? "good" : s === "over" ? "bad" : v >= t.value / 2 ? "warn" : "bad";
      return [
        { name: label, v, t: t.value, unit: t.unit, state, zones: microRange(t).zones },
      ];
    }),
  })).filter((g) => g.items.length > 0);
  return {
    summary: targets
      ? met + " su " + judged + " coperti · stime"
      : "stime · per gli obiettivi servono sesso ed età",
    groups,
  };
}
