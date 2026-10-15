/**
 * core/import/ingredients-upsert.ts — create or UPDATE ingredients by name
 * from a small file, leaving everything else untouched. Made for label
 * photos and receipt prices: "these 4 ingredients have new values/prices".
 *
 * File format (JSON): { "format": "lifeos-ingredients", "version": 1,
 *   "ingredients": [ { name, description, unit, kcal, protein, carbs, sugars,
 *   fat, saturatedFat, fiber, salt, packagePriceCents, packageSize } ] }
 * Values are exact decimal strings and integer cents, exactly like the
 * export (core/import/lifeos.ts validates them the same way).
 *
 * `planUpsert` compares with what the account has and returns, per
 * ingredient, "create" or "update" with the list of changed fields (old ->
 * new), so the dry run shows precisely what will change. `applyUpsert`
 * writes through the normal repositories (ownership, constraints).
 * Log entries keep their snapshots (ADR-0007): use "Update with current
 * values" on an entry to apply new values to it.
 */
import { z } from "zod";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { Big } from "../shared/decimal";
import { ok, type FieldErrors, type Result } from "../shared/result";
import {
  createIngredient,
  listIngredients,
  updateIngredient,
} from "../nutrition/repositories/ingredients";
import type { IngredientWrite } from "../nutrition/repositories/ingredients";

/** "12.300" with at most `scale` decimals (and no sign or exponent). */
const dec = (scale: number) =>
  z.string().regex(new RegExp(`^\\d{1,9}(\\.\\d{1,${scale}})?$`), "invalid_number");
const nutrient = dec(3);

/** One ingredient as stored (no id): every number exact, prices in pairs. */
const ingredientRow = z.object({
  name: z.string().min(1),
  description: z.string(),
  unit: z.enum(["g", "ml"]),
  kcal: nutrient,
  protein: nutrient,
  carbs: nutrient,
  sugars: nutrient,
  fat: nutrient,
  saturatedFat: nutrient,
  fiber: nutrient,
  salt: nutrient,
  packagePriceCents: z.number().int().nonnegative().nullable(),
  packageSize: dec(2).nullable(),
});

const upsertFile = z.object({
  format: z.literal("lifeos-ingredients"),
  version: z.literal(1),
  ingredients: z.array(ingredientRow).min(1),
});

export type UpsertRow = z.output<typeof ingredientRow>;
export type Change = { field: string; from: string; to: string };
export type PlannedUpsert =
  | { action: "create"; row: UpsertRow }
  | { action: "update"; id: string; row: UpsertRow; changes: Change[] }
  | { action: "same"; row: UpsertRow };

export function parseUpsertFile(
  raw: unknown,
): Result<UpsertRow[]> | { ok: false; problems: string[] } {
  const parsed = upsertFile.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  const problems = parsed.data.ingredients.flatMap((r, n) =>
    (r.packagePriceCents === null) !== (r.packageSize === null)
      ? [`ingredients.${n}: price_pair`]
      : [],
  );
  return problems.length ? { ok: false, problems } : ok(parsed.data.ingredients);
}

/** Compares as numbers where both are decimals ("588.000" equals "588"). */
function same(a: string | number | null, b: string | number | null): boolean {
  if (a === null || b === null) return a === b;
  const num = /^\d+(\.\d+)?$/;
  if (num.test(String(a)) && num.test(String(b))) return new Big(String(a)).eq(String(b));
  return String(a) === String(b);
}

const FIELDS = [
  "description",
  "unit",
  "kcal",
  "protein",
  "carbs",
  "sugars",
  "fat",
  "saturatedFat",
  "fiber",
  "salt",
  "packagePriceCents",
  "packageSize",
] as const;

export async function planUpsert(
  db: Db,
  owner: Owner,
  rows: UpsertRow[],
): Promise<PlannedUpsert[]> {
  const existing = new Map((await listIngredients(db, owner)).map((i) => [i.name, i]));
  return rows.map((row) => {
    const current = existing.get(row.name);
    if (!current) return { action: "create", row };
    const changes: Change[] = FIELDS.filter((f) => !same(current[f], row[f])).map(
      (f) => ({
        field: f,
        from: String(current[f] ?? "—"),
        to: String(row[f] ?? "—"),
      }),
    );
    return changes.length
      ? { action: "update", id: current.id, row, changes }
      : { action: "same", row };
  });
}

export async function applyUpsert(
  db: Db,
  owner: Owner,
  plan: PlannedUpsert[],
): Promise<{ name: string; errors: FieldErrors }[]> {
  const failed: { name: string; errors: FieldErrors }[] = [];
  for (const p of plan) {
    // Quality attributes and tags are not in the upsert file: left as they are.
    const input: IngredientWrite = { ...p.row };
    if (p.action === "same") continue;
    const r =
      p.action === "create"
        ? await createIngredient(db, owner, input)
        : await updateIngredient(db, owner, p.id, input);
    if (!r.ok) failed.push({ name: p.row.name, errors: r.errors });
  }
  return failed;
}
