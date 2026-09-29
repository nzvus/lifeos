/**
 * core/import/fitforge.ts — turns a FitForge export (the old app) into a plan
 * of lifeos ingredients and meals. PURE: reads nothing, writes nothing.
 * Writing the plan is ./fitforge-apply.ts; the command is
 * scripts/import-fitforge.ts.
 *
 * Why a "plan" first: the script shows the plan (dry run) before anything is
 * written, and every value goes through the SAME validation as the forms
 * (core/nutrition/validation.ts). Imported data obeys the same rules as typed
 * data; nothing sneaks in through the side door.
 *
 * FitForge format (export v1.0), only the parts used here:
 *   ingredients[]: { id, name, unit "g"|"ml", caloriesPer, proteinPer,
 *                    carbsPer, fatPer, fiberPer, sugarsPer, saturatedFatPer,
 *                    saltPer  (all per 100 g/ml), store, priceEuro,
 *                    priceQuantityG, nutritionalNotes }
 *   meals[]:       { name, items[]: { ingredientId, quantityG } }
 * Not imported: profile, dailyLogs, workouts, bodyMetrics (see ROADMAP).
 *
 * Tested in fitforge.test.ts.
 */
import { z } from "zod";
import { fail, ok, type FieldErrors, type Result } from "../shared/result";
import {
  ingredientInput,
  mealInput,
  parseInput,
  type IngredientInput,
} from "../nutrition/validation";

/** The shape we rely on. Anything else in the file is ignored. */
const num = z.number().nullable();
const fitForgeExport = z.object({
  exportVersion: z.string(),
  ingredients: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      unit: z.string(),
      caloriesPer: num,
      proteinPer: num,
      carbsPer: num,
      fatPer: num,
      fiberPer: num,
      sugarsPer: num,
      saturatedFatPer: num,
      saltPer: num,
      store: z.string().nullable(),
      priceEuro: num,
      priceQuantityG: num,
      nutritionalNotes: z.string().nullable(),
    }),
  ),
  meals: z.array(
    z.object({
      name: z.string(),
      items: z.array(z.object({ ingredientId: z.string(), quantityG: z.number() })),
    }),
  ),
});

/** Something the user should know about, as data (the script prints it). */
export type ImportIssue =
  /** Package size without price (or the reverse): imported without price. */
  | { kind: "price_dropped"; ingredient: string }
  /** Failed validation: not imported. `errors` uses the forms' error codes. */
  | { kind: "invalid_ingredient"; ingredient: string; errors: FieldErrors }
  | { kind: "invalid_meal"; meal: string; errors: FieldErrors }
  /** Uses an ingredient that isn't being imported: meal not imported. */
  | { kind: "meal_missing_ingredient"; meal: string; ingredient: string };

export type PlannedIngredient = {
  /** FitForge's id, used only to connect meal lines to ingredients. */
  sourceId: string;
  input: IngredientInput;
};

export type PlannedMeal = {
  name: string;
  items: { sourceIngredientId: string; quantity: string }[];
};

export type ImportPlan = {
  ingredients: PlannedIngredient[];
  meals: PlannedMeal[];
  issues: ImportIssue[];
};

/**
 * A number from JSON as the string our validation expects. JSON numbers are
 * already floats; String() gives their shortest exact decimal form
 * (0.1 -> "0.1"). If a value ever came out as "1e-7", validation reports it
 * as invalid_number rather than guessing.
 */
const str = (n: number | null): string => (n === null ? "" : String(n));

/** Store and notes have no column of their own: they go into the notes. */
function notesOf(store: string | null, notes: string | null): string {
  return [store, notes].filter((s) => s && s.trim()).join(" — ");
}

/** Placeholder id used ONLY to validate meal quantities before ids exist. */
const PLACEHOLDER_ID = "00000000-0000-4000-8000-000000000000";

export function planFitForgeImport(raw: unknown): Result<ImportPlan> {
  const parsed = fitForgeExport.safeParse(raw);
  if (!parsed.success) return fail({ _form: "invalid_choice" }); // not a FitForge export
  const data = parsed.data;
  const issues: ImportIssue[] = [];
  const ingredients: PlannedIngredient[] = [];

  for (const i of data.ingredients) {
    // Our rule: price and package size come together or not at all.
    let price = str(i.priceEuro);
    let size = str(i.priceQuantityG);
    if ((price === "") !== (size === "")) {
      issues.push({ kind: "price_dropped", ingredient: i.name });
      price = "";
      size = "";
    }
    // Exactly the fields the ingredient form sends.
    const form = {
      name: i.name,
      description: notesOf(i.store, i.nutritionalNotes),
      unit: i.unit,
      kcal: str(i.caloriesPer),
      protein: str(i.proteinPer),
      carbs: str(i.carbsPer),
      sugars: str(i.sugarsPer),
      fat: str(i.fatPer),
      saturatedFat: str(i.saturatedFatPer),
      fiber: str(i.fiberPer),
      salt: str(i.saltPer),
      packagePrice: price,
      packageSize: size,
    };
    const input = parseInput(ingredientInput, form);
    if (input.ok) ingredients.push({ sourceId: i.id, input: input.value });
    else
      issues.push({
        kind: "invalid_ingredient",
        ingredient: i.name,
        errors: input.errors,
      });
  }

  const importable = new Set(ingredients.map((i) => i.sourceId));
  const nameOf = new Map(data.ingredients.map((i) => [i.id, i.name]));
  const meals: PlannedMeal[] = [];

  for (const m of data.meals) {
    const missing = m.items.find((it) => !importable.has(it.ingredientId));
    if (missing) {
      issues.push({
        kind: "meal_missing_ingredient",
        meal: m.name,
        ingredient: nameOf.get(missing.ingredientId) ?? missing.ingredientId,
      });
      continue;
    }
    // Validate name and quantities with the meal form's rules. Ingredient ids
    // don't exist yet (they're created when the plan is applied), so a
    // placeholder stands in; ownership is checked again when writing.
    const check = parseInput(mealInput, {
      name: m.name,
      notes: "",
      items: m.items.map((it) => ({
        ingredientId: PLACEHOLDER_ID,
        quantity: String(it.quantityG),
      })),
    });
    if (!check.ok) {
      issues.push({ kind: "invalid_meal", meal: m.name, errors: check.errors });
      continue;
    }
    meals.push({
      name: check.value.name,
      items: m.items.map((it, idx) => ({
        sourceIngredientId: it.ingredientId,
        quantity: check.value.items[idx]!.quantity,
      })),
    });
  }

  return ok({ ingredients, meals, issues });
}
