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
import { dayMicros } from "@/core/food/micros";

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
  const meals = [...day.timed, ...day.untimed].filter((i) => i.kind.key === "meal");
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
              t: targets?.sugars ?? (kcal * 45) / 1000,
            },
        {
          key: "sat",
          v: v(eaten, "saturatedFat"),
          t: targets?.saturatedFat ?? (basis.kcal * 0.1) / 9,
          ...zones(saturatedRange),
        },
        {
          key: "salt",
          v: v(eaten, "salt"),
          t: targets?.salt ?? 5,
          zones: saltRange().zones,
        },
      ]
    : [];
  return {
    entry: {
      fam: "day",
      title: "Il giorno",
      meta:
        targets === null
          ? "obiettivi non ancora calcolati in v2"
          : targets.from === "day"
            ? "obiettivi fissati per questo giorno"
            : "obiettivi della settimana dal " + F.date(targets.since),
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
      })),
      ...(estimates.size > 0 ? { micros: microsOf(eatenMicros, microTargets) } : {}),
      limits,
    },
  };
}

/**
 * A meal's nutrients: its thin macro bars (L0), and its L1 when its box
 * opens (kcal, kinds, where each came from). What it brought (or will
 * bring, when planned), split into kinds, against the day's targets — a slot's targets
 * come with day templates (E5 `slotTargets`); without day targets the bars
 * share one scale. Null for a meal with nothing to show (a coffee).
 */
export function mealL0(
  meal: DayItem,
  targets: FoodTargets | null,
  estimates: ReadonlyMap<string, Record<string, string>> = new Map(),
): NutrientsData | null {
  if (meal.kind.key !== "meal") return null;
  const { eaten, planned, kinds, sources } = dayFood([food(meal, estimates)]);
  const got = meal.status === "planned" ? planned : eaten;
  const v = (f: string) => Number(got[f] ?? 0);
  if (MACROS.every(([, f]) => v(f) === 0)) return null;
  return {
    kcal: { v: v("kcal"), t: targets?.kcal ?? null },
    macros: MACROS.map(([key, f]) => ({
      key,
      v: v(f),
      t: targets?.[f] ?? null,
      // Where it came from: only for a done meal (dayFood's sources are what was eaten).
      ...(meal.status === "planned"
        ? {}
        : {
            sources: (sources[f] ?? []).map((s): [string, number] => [
              s.name,
              Number(s.amount),
            ]),
          }),
      ...(estimates.size > 0 ? { parts: kinds[f] } : {}),
    })),
  };
}

/** The foods a day's meals were made of, for their kind estimates. */
export function foodIds(day: Day): string[] {
  return [...day.timed, ...day.untimed]
    .filter((i) => i.kind.key === "meal")
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
