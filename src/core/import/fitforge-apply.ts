/**
 * core/import/fitforge-apply.ts — carries out an ImportPlan (./fitforge.ts)
 * for one owner, or, in dry-run mode, only reports what it WOULD do.
 *
 * Rules:
 *   - Writes only through the normal repositories (ADR-0003), so ownership
 *     checks, constraints and error codes are the same as in the app.
 *   - Idempotent by name: an ingredient or meal whose name already exists is
 *     left untouched and reported as "existing". Re-running after a partial
 *     failure therefore finishes the job without creating duplicates.
 *   - An existing ingredient with the same name is REUSED by imported meals.
 *   - Not one big transaction: each meal is atomic on its own (the repository
 *     uses a transaction), and the whole import is safe to re-run instead.
 *
 * Tested in fitforge.test.ts.
 */
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { createIngredient, listIngredients } from "../nutrition/repositories/ingredients";
import { createMeal, listMeals } from "../nutrition/repositories/meals";
import type { FieldErrors } from "../shared/result";
import type { ImportPlan } from "./fitforge";

export type ImportReport = {
  applied: boolean;
  ingredients: {
    created: string[];
    existing: string[];
    failed: { name: string; errors: FieldErrors }[];
  };
  meals: {
    created: string[];
    existing: string[];
    failed: { name: string; errors: FieldErrors }[];
  };
};

export async function applyFitForgeImport(
  db: Db,
  owner: Owner,
  plan: ImportPlan,
  options: { apply: boolean },
): Promise<ImportReport> {
  const report: ImportReport = {
    applied: options.apply,
    ingredients: { created: [], existing: [], failed: [] },
    meals: { created: [], existing: [], failed: [] },
  };

  // FitForge id -> lifeos id, filled as ingredients are found or created.
  const idBySource = new Map<string, string>();
  const existingIngredients = new Map(
    (await listIngredients(db, owner)).map((i) => [i.name, i.id]),
  );

  for (const p of plan.ingredients) {
    const existingId = existingIngredients.get(p.input.name);
    if (existingId) {
      report.ingredients.existing.push(p.input.name);
      idBySource.set(p.sourceId, existingId);
    } else if (!options.apply) {
      report.ingredients.created.push(p.input.name); // "would create"
    } else {
      const r = await createIngredient(db, owner, p.input);
      if (r.ok) {
        report.ingredients.created.push(p.input.name);
        idBySource.set(p.sourceId, r.value.id);
      } else {
        report.ingredients.failed.push({ name: p.input.name, errors: r.errors });
      }
    }
  }

  const existingMeals = new Set((await listMeals(db, owner)).map((m) => m.name));
  for (const m of plan.meals) {
    if (existingMeals.has(m.name)) {
      report.meals.existing.push(m.name);
      continue;
    }
    if (!options.apply) {
      report.meals.created.push(m.name);
      continue;
    }
    const ids = m.items.map((it) => idBySource.get(it.sourceIngredientId));
    if (ids.some((id) => id === undefined)) {
      // An ingredient of this meal failed to import just above.
      report.meals.failed.push({ name: m.name, errors: { items: "not_found" } });
      continue;
    }
    const r = await createMeal(db, owner, {
      name: m.name,
      notes: "",
      items: m.items.map((it, idx) => ({
        ingredientId: ids[idx]!,
        quantity: it.quantity,
      })),
    });
    if (r.ok) report.meals.created.push(m.name);
    else report.meals.failed.push({ name: m.name, errors: r.errors });
  }

  return report;
}
