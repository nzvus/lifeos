/**
 * core/nutrition/nutrients.ts — THE list of nutrients the app tracks.
 *
 * Why this file exists: "one place per thing" (ADR-0001 "What I learned",
 * ADR-0002). Every other file that deals with nutrients derives from this list:
 *   - core/db/schema/nutrition.ts   builds one DB column per key
 *   - core/nutrition/totals.ts      sums every key
 *   - core/nutrition/validation.ts  validates every key in forms
 *   - i18n/messages.*.ts            has a label for every key (type-checked)
 *   - features/nutrition/*          renders every key in tables and forms
 * Adding a nutrient = add it here + generate a migration (npm run db:generate).
 * TypeScript then points at every place that still needs a label.
 *
 * Pure module: no framework, no database, safe to import from client code.
 */

/**
 * `as const` makes this a readonly tuple of literal strings instead of
 * `string[]`, so `NutrientKey` below is the union "kcal" | "protein" | ...,
 * and a typo like "protien" is a compile error everywhere.
 */
export const NUTRIENT_KEYS = [
  "kcal", // energy
  "protein",
  "carbs", // total carbohydrates
  "sugars", // of which sugars
  "fat", // total fat
  "saturatedFat", // of which saturated
  "fiber",
  "salt", // EU labels give salt, not sodium
] as const;

/** The union type "kcal" | "protein" | ... derived from the list above. */
export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

/** Display unit per nutrient. Energy is kcal, everything else grams. */
export const NUTRIENT_UNIT: Record<NutrientKey, "kcal" | "g"> = {
  kcal: "kcal",
  protein: "g",
  carbs: "g",
  sugars: "g",
  fat: "g",
  saturatedFat: "g",
  fiber: "g",
  salt: "g",
};

/**
 * Nutrient values as they travel between the database and the domain logic.
 *
 * They are STRINGS on purpose. Postgres `numeric` is an exact decimal, and the
 * pg driver returns it as a string ("12.30") precisely so JavaScript's binary
 * floating point never touches it (0.1 + 0.2 !== 0.3 in JS). ADR-0003: macros
 * are `numeric`, never floating point. Arithmetic happens via core/shared/decimal.ts.
 */
export type NutrientValues = Record<NutrientKey, string>;
