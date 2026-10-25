/**
 * features/food/composer.ts — the meal composer's numbers (V-04), pure so
 * the browser recomputes them on every keystroke: the meal's totals from
 * its lines (core/food `lineTotals`, exact), the meal on its own as
 * Nutrients data, and the day with this meal added as the hatched
 * "planned" part against the day's targets: the live preview the spec
 * asks for. Plus the words for core's line errors.
 */
import type { MacroKey, NutrientsData } from "@lifeos/kit";
import { F } from "@lifeos/kit";
import type { FoodChoice, RecipeChoice } from "@/core/food/choices";
import { blockFit } from "@/core/food/score";
import type { EntryErrors } from "@/core/entries";
import {
  ESTIMATE_FIELDS,
  type EstimateError,
  type EstimateField,
  type LineError,
  type LineInput,
  type LinesError,
} from "@/core/food/meal";
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
  /** Its foods (the kit's L2 window: chips, each food's part of the bars). */
  foods?: NutrientsData["foods"],
  /** Its block's targets (the day's model, features/day/slots): the bars measure against them. */
  block?: Slot | null,
): NutrientsData {
  return {
    ...(foods && foods.length ? { foods } : {}),
    ...(block ? { kcal: { v: t["kcal"] ?? 0, t: block.kcal } } : {}),
    macros: MACROS.map(([key, f]) => ({
      key,
      v: t[f] ?? 0,
      ...(block && block[f as keyof Slot] != null
        ? { t: block[f as keyof Slot] as number }
        : {}),
      ...(kinds ? { parts: kinds[f as keyof MacroKinds] } : {}),
    })),
  };
}

/** A meal block's targets for the composer (plain numbers from the page). */
export type Slot = {
  kcal: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fibre: number | null;
};

/** The meal's foods for its window (L2): each line with its grams per macro and kind. */
export function mealFoods(
  lines: readonly DraftLine[],
  choices: ReadonlyMap<string, FoodChoice>,
  servings = "1",
): NonNullable<NutrientsData["foods"]> {
  const times = quantityOf(servings) ?? "1";
  return lines.flatMap((l) => {
    const c = choices.get(l.key);
    const q = quantityOf(l.quantity);
    if (!c || !q) return [];
    const one = [
      {
        quantity: q,
        values: c.per100,
        ...(c.estimates ? { estimates: c.estimates } : {}),
      },
    ];
    const k = macroKinds(one, times);
    const kcal = Number(lineTotals(one, times)["kcal"] ?? 0);
    const whole = (m: Record<string, number>) =>
      c.estimates ? m : { all: Object.values(m).reduce((a, v) => a + v, 0) };
    return [
      {
        key: l.key,
        name: c.name,
        amount:
          F.num(Number(q) * Number(times), c.unit) +
          (kcal > 0 ? " · " + F.n(kcal, 0) + " kcal" : ""),
        kcal,
        macros: {
          protein: whole(k.protein),
          carbs: whole(k.carbs),
          fat: whole(k.fat),
          fiber: whole(k.fibre),
        },
      },
    ];
  });
}

/**
 * «Per arrivare al blocco» (the board Food): the protein the block still
 * misses and two ways to close it, each with what it adds — raising a food
 * already in the meal, or adding one of the person's usual foods dense in
 * protein (≥ 8 g per 100 kcal). Amounts in steps of 10 (g or ml), never
 * past twice the usual quantity; nothing when the block is covered.
 */
export function closeTheGap(
  t: Record<string, number>,
  block: Slot | null,
  lines: readonly DraftLine[],
  choices: readonly FoodChoice[],
): {
  gap: number;
  ideas: {
    key: string;
    name: string;
    quantity: string;
    protein: number;
    kcal: number;
    raise: boolean;
  }[];
} | null {
  if (!block?.protein) return null;
  const gap = block.protein - (t["protein"] ?? 0);
  if (gap < 3) return { gap: 0, ideas: [] };
  const per = (c: FoodChoice, f: string) => Number(c.per100[f] ?? 0) / 100;
  const dense = (c: FoodChoice) =>
    per(c, "kcal") > 0 && per(c, "protein") / per(c, "kcal") >= 0.08;
  const step = (q: number) => Math.max(10, Math.ceil(q / 10) * 10);
  const by = new Map(choices.map((c) => [c.key, c]));
  const raise = lines.flatMap((l) => {
    const c = by.get(l.key);
    const now = Number(quantityOf(l.quantity) ?? 0);
    if (!c || !dense(c) || now <= 0) return [];
    const more = Math.min(step(gap / per(c, "protein")), now);
    return [
      {
        key: c.key,
        name: c.name,
        quantity: String(now + more),
        protein: more * per(c, "protein"),
        kcal: more * per(c, "kcal"),
        raise: true,
      },
    ];
  });
  const add = choices
    .filter((c) => c.uses > 0 && dense(c) && !lines.some((l) => l.key === c.key))
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 6)
    .map((c) => {
      const usual = Number(c.lastQty ?? 100);
      const q = Math.min(step(gap / per(c, "protein")), step(usual * 2));
      return {
        key: c.key,
        name: c.name,
        quantity: String(q),
        protein: q * per(c, "protein"),
        kcal: q * per(c, "kcal"),
        raise: false,
      };
    });
  // The ones closing most of the gap for the fewest kcal first.
  const rank = (x: { protein: number; kcal: number }) =>
    Math.min(x.protein, gap) / Math.max(1, x.kcal);
  return {
    gap,
    ideas: [
      ...raise.sort((a, b) => rank(b) - rank(a)).slice(0, 1),
      ...add.sort((a, b) => rank(b) - rank(a)),
    ].slice(0, 2),
  };
}

/** «Pasti adatti» (the board Food): the saved meals fitting the block best (`blockFit`), at least 0,5. */
export function fittingRecipes(
  recipes: readonly RecipeChoice[],
  choices: ReadonlyMap<string, FoodChoice>,
  block: Slot | null,
  limit = 2,
): { recipe: RecipeChoice; kcal: number; protein: number; fit: number }[] {
  if (!block) return [];
  return recipes
    .map((r) => {
      const t = r.estimate
        ? Object.fromEntries(Object.entries(r.estimate).map(([f, v]) => [f, Number(v)]))
        : mealTotals(r.parts, choices);
      const kcal = t["kcal"] ?? 0;
      const protein = t["protein"] ?? 0;
      return {
        recipe: r,
        kcal,
        protein,
        fit:
          blockFit(
            { kcal, protein },
            { kcal: block.kcal, protein: block.protein ?? 0 },
          ) ?? 0,
      };
    })
    .filter((x) => x.fit >= 0.5)
    .sort((a, b) => b.fit - a.fit || b.recipe.uses - a.recipe.uses)
    .slice(0, limit);
}

/** The day's Nutrients with this meal added to what is planned. */
export function dayWithMeal(
  dayData: NutrientsData,
  t: Record<string, number>,
): NutrientsData {
  // The micros are the day's eaten ones, without this meal's: kept (the same panel everywhere,
  // the developer 2026-10-25), and their summary says so.
  const { micros, ...day } = dayData;
  const add = (planned: number | undefined, f: string) => (planned ?? 0) + (t[f] ?? 0);
  return {
    ...(micros
      ? { micros: { ...micros, summary: micros.summary + " · senza questo pasto" } }
      : {}),
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

export const ESTIMATE_WORDS: Record<EstimateError, string> = {
  required: "Scrivi le kcal, anche a occhio.",
  number: "Scrivi un numero, per esempio 650 o 30,5.",
  too_much: "È troppo per un pasto: controlla il numero.",
};

/** The typed totals of an estimate, as the preview's numbers; what is not a number is left out. */
export function estimateTotals(
  typed: Partial<Record<EstimateField, string>>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of ESTIMATE_FIELDS) {
    const q = quantityOf(typed[f] ?? "");
    if (q !== null) out[f] = Number(q);
  }
  return out;
}

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

/**
 * A logged meal's lines as a new meal's (V-04 «Registra di nuovo»): each
 * line names its food (and product) as today's choice, at the quantity it
 * had; a line whose food left the catalog, or was never known, is left out,
 * since the new meal reads today's values, not the old snapshot.
 */
export function repeatLines(
  lines: readonly { itemId: string | null; productId: string | null; quantity: string }[],
  choiceKeys: ReadonlySet<string>,
): { lines: DraftLine[]; dropped: number } {
  const out: DraftLine[] = [];
  for (const l of lines) {
    if (!l.itemId) continue;
    const key = l.productId ? l.itemId + ":" + l.productId : l.itemId;
    const k = choiceKeys.has(key) ? key : choiceKeys.has(l.itemId) ? l.itemId : null;
    if (k && !out.some((x) => x.key === k))
      out.push({ key: k, quantity: String(Number(l.quantity)).replace(".", ",") });
  }
  return { lines: out, dropped: lines.length - out.length };
}

/** A food's energy by macro, as the board's ribbon under each ingredient. */
export function macroStrip(per100: Record<string, string>): { w: number; c: string }[] {
  const kcal = [
    ["protein", 4, "var(--macro-protein)"],
    ["carbs", 4, "var(--macro-carbs)"],
    ["fat", 9, "var(--macro-fat)"],
    ["fibre", 2, "var(--macro-fiber)"],
  ].map(([k, f, c]) => ({
    v: Number(per100[k as string] ?? 0) * (f as number),
    c: c as string,
  }));
  const total = kcal.reduce((a, x) => a + x.v, 0);
  return total > 0
    ? kcal
        .filter((x) => x.v > 0)
        .map((x) => ({ w: Math.round((x.v / total) * 100), c: x.c }))
    : [];
}
