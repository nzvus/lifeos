/**
 * features/food/composer.ts — the meal composer's numbers (V-04), pure so
 * the browser recomputes them on every keystroke: the meal's totals from
 * its lines (core/food `lineTotals`, exact), the meal on its own as
 * Nutrients data, and the day with this meal added as the hatched
 * "planned" part against the day's targets: the live preview the spec
 * asks for. Plus the words for core's line errors.
 */
import type { MacroKey, NutrientsData } from "@lifeos/kit";
import type { FoodChoice } from "@/core/food/choices";
import type { EntryErrors } from "@/core/entries";
import type { LineError, LineInput, LinesError } from "@/core/food/meal";
import type { RecipeNameError } from "@/core/food/recipes";
import { macroKinds, type MacroKinds } from "@/core/food/kinds";
import { lineTotals } from "@/core/food/totals";

export type DraftLine = { key: string; quantity: string };

const MACROS: [MacroKey, string][] = [
  ["protein", "protein"],
  ["carbs", "carbs"],
  ["fat", "fat"],
  ["fiber", "fibre"],
];
const LIMITS: [NonNullable<NutrientsData["limits"]>[number]["key"], string][] = [
  ["sugars", "sugars"],
  ["sat", "saturatedFat"],
  ["salt", "salt"],
];

/** "07:30" → 450, the clock minute a meal's role reads; anything else → null. */
export function clockMinute(t: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** "60,5" → "60.5"; anything else that is not a positive number → null. */
export function quantityOf(q: string): string | null {
  const s = q.trim().replace(",", ".");
  return /^\d+(\.\d+)?$/.test(s) && Number(s) > 0 ? s : null;
}

/** Field → the meal's total, as numbers (for drawing; the server keeps them exact). */
export function mealTotals(
  lines: readonly DraftLine[],
  choices: ReadonlyMap<string, FoodChoice>,
  servings = "1",
): Record<string, number> {
  const snap = lines.flatMap((l) => {
    const c = choices.get(l.key);
    const q = quantityOf(l.quantity);
    return c && q ? [{ quantity: q, values: c.per100 }] : [];
  });
  return Object.fromEntries(
    Object.entries(lineTotals(snap, quantityOf(servings) ?? "1")).map(([f, v]) => [
      f,
      Number(v),
    ]),
  );
}

/** The meal's macros split into their kinds, from its choices' estimates (core/food/kinds). */
export function mealKinds(
  lines: readonly DraftLine[],
  choices: ReadonlyMap<string, FoodChoice>,
  servings = "1",
): MacroKinds {
  return macroKinds(
    lines.flatMap((l) => {
      const c = choices.get(l.key);
      const q = quantityOf(l.quantity);
      return c && q
        ? [
            {
              quantity: q,
              values: c.per100,
              ...(c.estimates ? { estimates: c.estimates } : {}),
            },
          ]
        : [];
    }),
    quantityOf(servings) ?? "1",
  );
}

/**
 * The meal by itself: its kcal are the Box's value, its macros on one scale
 * with no ticks (a slot's targets come with the plan), split into kinds.
 */
export function mealNutrients(
  t: Record<string, number>,
  kinds?: MacroKinds,
): NutrientsData {
  return {
    macros: MACROS.map(([key, f]) => ({
      key,
      v: t[f] ?? 0,
      ...(kinds ? { parts: kinds[f as keyof MacroKinds] } : {}),
    })),
  };
}

/** The day's Nutrients with this meal added to what is planned. */
export function dayWithMeal(
  dayData: NutrientsData,
  t: Record<string, number>,
): NutrientsData {
  // The micros are the day's eaten ones: without the meal's they would mislead, so they stay out.
  const { micros: _micros, ...day } = dayData;
  const add = (planned: number | undefined, f: string) => (planned ?? 0) + (t[f] ?? 0);
  return {
    ...(day.kcal
      ? { kcal: { ...day.kcal, planned: add(day.kcal.planned, "kcal") } }
      : {}),
    macros: day.macros.map((m) => ({
      ...m,
      planned: add(m.planned, MACROS.find(([k]) => k === m.key)![1]),
    })),
    ...(day.limits
      ? {
          limits: day.limits.map((l) => ({
            ...l,
            v: l.v + (t[LIMITS.find(([k]) => k === l.key)![1]] ?? 0),
          })),
        }
      : {}),
  };
}

export const RECIPE_WORDS: Record<RecipeNameError, string> = {
  empty: "Dai un nome al pasto da salvare.",
  too_long: "Al massimo 80 caratteri.",
  taken: "Hai già un pasto salvato con questo nome.",
};

export const LINE_WORDS: Record<LineError | LinesError, string> = {
  unknown: "Questo cibo non è più nel catalogo.",
  quantity: "Scrivi una quantità, per esempio 60 o 60,5.",
  too_much: "È più di 5 kg: controlla la quantità.",
  empty: "Aggiungi almeno un cibo.",
  too_many: "Al massimo 40 cibi in un pasto.",
};

/** The lines a composer posted: anything else than a list of { key, quantity } strings is none. */
export function parseLines(raw: string): LineInput[] {
  try {
    const x: unknown = JSON.parse(raw);
    if (!Array.isArray(x) || x.length > 100) return [];
    return x.flatMap((l: unknown) => {
      const o = l as Partial<LineInput> | null;
      return o !== null &&
        typeof o === "object" &&
        typeof o.key === "string" &&
        typeof o.quantity === "string"
        ? [{ key: o.key, quantity: o.quantity }]
        : [];
    });
  } catch {
    return [];
  }
}

/** Core's answers → the composer's words, by its names ("role", "line.<i>", "lines"). */
export function mealErrors(
  entry: EntryErrors | null,
  lines: { lines?: LinesError; at: Record<number, LineError> } | null,
  words: (e: EntryErrors) => Record<string, string>,
): Record<string, string> {
  const out = entry ? words(entry) : {};
  if (out["v.role"]) out["role"] = out["v.role"];
  if (lines) {
    if (lines.lines) out["lines"] = LINE_WORDS[lines.lines];
    for (const [i, code] of Object.entries(lines.at)) out["line." + i] = LINE_WORDS[code];
  }
  return out;
}
