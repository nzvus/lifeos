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
import { MOMENTS } from "../nutrition/moments";
import { FIBER_TYPES, ORIGINS, TAG_ICONS } from "../nutrition/quality";
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

/** ADR-0012 quality attributes; absent in files before version 5. */
const quality = {
  nova: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .nullable()
    .default(null),
  origin: z.enum(ORIGINS).nullable().default(null),
  fiberTypes: z.array(z.enum(FIBER_TYPES)).default([]),
};

const exportFile = z.object({
  format: z.literal("lifeos-export"),
  version: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    // 6 adds `training`; this importer restores nutrition only and ignores it
    // (training is imported from its own sources: npm run import:training).
    z.literal(6),
    // 7 adds `pantry` (ADR-0017); ignored here like `training`.
    z.literal(7),
    // 8 adds `assistant` (ADR-0018); 9 adds training `programs` (ADR-0024);
    // 10 adds each measurement's `context` (ADR-0027); 11 the nights of
    // sleep (ADR-0031); 12 program day items and skips (ADR-0035); all
    // ignored here.
    z.literal(8),
    z.literal(9),
    z.literal(10),
    z.literal(11),
    // 12: program day items and skips (ADR-0035); ignored here like `training`.
    z.literal(12),
  ]),
  settings: z
    .object({
      timezone: z.string(),
      locale: z.string(),
      // Version 3+ (ADR-0010) and 5 (migration 0006): absent in older files,
      // then the defaults. Checked again by the database constraints.
      theme: z.string().default("label"),
      autoTargets: z.boolean().default(true),
      lunchFrom: z.number().int().default(660),
      snackFrom: z.number().int().default(900),
      dinnerFrom: z.number().int().default(1110),
      trendsRange: z.number().int().default(7),
      listSort: z.string().default("used"),
      listPer: z.string().default("none"),
    })
    .nullable(),
  ingredients: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      description: z.string(),
      unit,
      ...nutrients,
      ...price,
      // Version 5 (ADR-0012); older files: not classified, no tags.
      ...quality,
      tags: z
        .array(
          z.object({ name: z.string().min(1), icon: z.enum(TAG_ICONS).catch("tag") }),
        )
        .default([]),
    }),
  ),
  meals: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      notes: z.string(),
      // Version 4 (ADR-0011); older files have no category.
      category: z.enum(MOMENTS).nullable().default(null),
      // Version 5 (ADR-0012): notes and scores; older files have none.
      review: z.string().default(""),
      ratings: z
        .array(z.object({ factorId: z.string(), score: z.number().int().min(1).max(5) }))
        .default([]),
      items: z.array(
        z.object({
          ingredientId: z.string(),
          quantity: dec(2),
          position: z.number().int(),
        }),
      ),
    }),
  ),
  ratingFactors: z
    .array(
      z.object({ id: z.string(), name: z.string().min(1), position: z.number().int() }),
    )
    .default([]),
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
      // Version 4 (ADR-0011); older files have no moment (derived from the time).
      moment: z.enum(MOMENTS).nullable().default(null),
      items: z.array(
        z.object({
          ingredientId: z.string().nullable(),
          name: z.string(),
          unit,
          quantity: dec(2),
          position: z.number().int(),
          ...nutrients,
          ...price,
          ...quality, // version 5: the snapshot's quality attributes
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
