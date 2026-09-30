/**
 * core/import/lifeos.ts — reads a lifeos export (core/export/export.ts,
 * format "lifeos-export", versions 1 and 2) back into a validated plan.
 * PURE: no database. Writing is ./lifeos-apply.ts.
 *
 * Why strict validation: the file may have been edited by hand (renames,
 * notes). Every number must be a plain decimal with no more decimals than
 * its column stores (else Postgres would round silently — PROJECT.md's
 * primary invariant), prices come in pairs, units are g/ml.
 * The export stores values exactly as the database does (decimal strings,
 * integer cents), so a valid file round-trips without any loss.
 *
 * Ids in the file are only used to connect rows (meal -> ingredient,
 * entry -> meal, plan -> profile); the database gives every row a new id.
 */
import { z } from "zod";
import { ok, type Result } from "../shared/result";
import { isValidDay } from "../shared/dates";

/** "12.300" with at most `scale` decimals (and no sign or exponent). */
const dec = (scale: number) =>
  z.string().regex(new RegExp(`^\\d{1,9}(\\.\\d{1,${scale}})?$`), "invalid_number");
const nutrient = dec(3);
const nutrients = {
  kcal: nutrient,
  protein: nutrient,
  carbs: nutrient,
  sugars: nutrient,
  fat: nutrient,
  saturatedFat: nutrient,
  fiber: nutrient,
  salt: nutrient,
};
const targets = Object.fromEntries(
  Object.keys(nutrients).map((k) => [k, nutrient.nullable()]),
) as Record<keyof typeof nutrients, z.ZodNullable<typeof nutrient>>;
const unit = z.enum(["g", "ml"]);
const price = {
  packagePriceCents: z.number().int().nonnegative().nullable(),
  packageSize: dec(2).nullable(),
};
const day = z.string().refine(isValidDay, "invalid_day");

/** One ingredient as stored/exported (no id). Reused by ./ingredients-upsert.ts. */
export const ingredientRow = z.object({
  name: z.string().min(1),
  description: z.string(),
  unit,
  ...nutrients,
  ...price,
});

const exportFile = z.object({
  format: z.literal("lifeos-export"),
  version: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  settings: z.object({ timezone: z.string(), locale: z.string() }).nullable(),
  ingredients: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      description: z.string(),
      unit,
      ...nutrients,
      ...price,
    }),
  ),
  meals: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      notes: z.string(),
      items: z.array(
        z.object({
          ingredientId: z.string(),
          quantity: dec(2),
          position: z.number().int(),
        }),
      ),
    }),
  ),
  dayProfiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        isDefault: z.boolean(),
        ...targets,
      }),
    )
    .default([]),
  dayPlans: z
    .array(
      z.object({
        day,
        profileId: z.string().nullable(),
        profileName: z.string(),
        ...targets,
      }),
    )
    .default([]),
  log: z.array(
    z.object({
      day,
      mealId: z.string().nullable(),
      label: z.string(),
      servings: dec(2),
      createdAt: z.string(),
      // Version 3 (ADR-0009); older files default to "eaten, time unknown".
      status: z.enum(["planned", "eaten"]).default("eaten"),
      at: z.string().nullable().default(null),
      estimated: z.boolean().default(false),
      items: z.array(
        z.object({
          ingredientId: z.string().nullable(),
          name: z.string(),
          unit,
          quantity: dec(2),
          position: z.number().int(),
          ...nutrients,
          ...price,
        }),
      ),
    }),
  ),
});

export type LifeosImport = z.output<typeof exportFile>;

/** Validates the file; on failure returns where (path) and what went wrong. */
export function parseLifeosExport(
  raw: unknown,
): Result<LifeosImport> | { ok: false; problems: string[] } {
  const parsed = exportFile.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      problems: parsed.error.issues
        .slice(0, 20)
        .map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  const data = parsed.data;
  // Cross-checks zod can't express per row.
  const problems: string[] = [];
  const pair = (
    where: string,
    p: { packagePriceCents: number | null; packageSize: string | null },
  ) => {
    if ((p.packagePriceCents === null) !== (p.packageSize === null))
      problems.push(`${where}: price_pair`);
  };
  const ingredientIds = new Set(data.ingredients.map((i) => i.id));
  const names = new Set<string>();
  data.ingredients.forEach((i, n) => {
    pair(`ingredients.${n}`, i);
    if (names.has(i.name)) problems.push(`ingredients.${n}: duplicate_name "${i.name}"`);
    names.add(i.name);
  });
  data.meals.forEach((m, n) =>
    m.items.forEach((it, k) => {
      if (!ingredientIds.has(it.ingredientId))
        problems.push(`meals.${n}.items.${k}: not_found`);
    }),
  );
  if (data.dayProfiles.filter((p) => p.isDefault).length > 1)
    problems.push("dayProfiles: more than one default");
  data.log.forEach((e, n) => e.items.forEach((it, k) => pair(`log.${n}.items.${k}`, it)));
  if (problems.length) return { ok: false, problems };
  return ok(data);
}
