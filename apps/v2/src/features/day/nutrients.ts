/**
 * features/day/nutrients.ts — the day as a Box (V-01, kit.md §5): its
 * meals added up (core/food `dayFood`) against the targets in force
 * (core/day `readDayTargets`), as the kit's Nutrients L1 data, and the
 * Box's line saying where the targets come from. Pure: tested without a
 * browser. The day's scores join it when E7's weights are decided.
 */
import { F, type BoxEntry, type MacroKey, type NutrientsData } from "@lifeos/kit";
import type { Day, DayItem, FoodTargets } from "@/core/day";
import { dayFood, type FoodEntry } from "@/core/food/day";

/** The kit's macro → the field the snapshot and the targets use. */
const MACROS: [MacroKey, "protein" | "carbs" | "fat" | "fibre"][] = [
  ["protein", "protein"],
  ["carbs", "carbs"],
  ["fat", "fat"],
  ["fiber", "fibre"],
];

const food = (i: DayItem): FoodEntry => ({
  status: i.status,
  leftOut: i.values["leftOut"] === true,
  servings: typeof i.values["servings"] === "string" ? i.values["servings"] : null,
  lines: i.lines,
});

export function presentDay(
  day: Day,
  targets: FoodTargets | null,
): { entry: BoxEntry; nutrients: NutrientsData } | null {
  const meals = [...day.timed, ...day.untimed].filter((i) => i.kind.key === "meal");
  if (meals.length === 0 && targets === null) return null;
  const { eaten, planned, sources } = dayFood(meals.map(food));
  const v = (r: Record<string, string>, f: string) => Number(r[f] ?? 0);
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
      })),
      limits: targets
        ? [
            { key: "sugars", v: v(eaten, "sugars"), t: targets.sugars },
            { key: "sat", v: v(eaten, "saturatedFat"), t: targets.saturatedFat },
            { key: "salt", v: v(eaten, "salt"), t: targets.salt },
          ]
        : [],
    },
  };
}
