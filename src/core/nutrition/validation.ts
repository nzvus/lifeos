/**
 * core/nutrition/validation.ts — every rule about what input is acceptable.
 *
 * Why in core/ and not in the forms: validation is BEHAVIOUR (ADR-0002: shared
 * behaviour lives in core/). The browser can be bypassed — anyone can POST
 * anything to a server action — so the server must validate regardless, and
 * one definition serves every form.
 *
 * Flow: a server action (src/app/(app)/**\/actions.ts) turns FormData into a
 * plain object -> `parseInput(schema, data)` -> either typed, cleaned values
 * or FieldErrors with codes the UI translates (core/shared/result.ts).
 *
 * Library: zod (v4). A schema describes the shape; `safeParse` checks it and
 * returns either the typed data or a list of issues. We put our ErrorCode in
 * each issue's message.
 */
import { z } from "zod";
import { Big, parseDecimalInput } from "../shared/decimal";
import { isValidDay, isValidTime, isValidTimeZone } from "../shared/dates";
import { ERROR_CODES, type ErrorCode, type FieldErrors } from "../shared/result";
import { INGREDIENT_UNITS } from "../db/schema/nutrition";
import { NUTRIENT_KEYS, type NutrientKey } from "./nutrients";
import { LOCALES } from "../shared/locales";

/**
 * A decimal typed by a person, e.g. "12,5". Returns the canonical string.
 * `scale` = max digits after the point, matching the DB column. Without this
 * check, Postgres would silently round 1.23456 into numeric(10,3) as 1.235 —
 * a small silent corruption, exactly what PROJECT.md forbids.
 */
function decimalString(opts: { scale: number; max: string; positive?: boolean }) {
  return z.string().transform((raw, ctx) => {
    const fail = (code: ErrorCode) => {
      ctx.addIssue({ code: "custom", message: code });
      return z.NEVER; // tells zod "no value": the field is invalid
    };
    if (raw.trim() === "") return fail("required");
    const value = parseDecimalInput(raw);
    if (value === null) return fail("invalid_number");
    const decimals = value.split(".")[1]?.length ?? 0;
    if (decimals > opts.scale) return fail("too_many_decimals");
    if (new Big(value).gt(opts.max)) return fail("too_large");
    if (opts.positive && new Big(value).eq(0)) return fail("not_positive");
    return value;
  });
}

/** Same as decimalString, but an empty field means "not set" (null). */
function optionalDecimalString(opts: { scale: number; max: string }) {
  return z
    .string()
    .transform((raw) => (raw.trim() === "" ? null : raw))
    .pipe(decimalString(opts).nullable());
}

// Column limits, mirrored from core/db/schema/nutrition.ts.
const NUTRIENT = { scale: 3, max: "9999999" }; // numeric(10,3)
const QUANTITY = { scale: 2, max: "99999999" }; // numeric(10,2)
const SERVINGS = { scale: 2, max: "9999", positive: true }; // numeric(6,2)

const name = z.string().trim().min(1, "required").max(120, "too_long");
const id = z.uuid("not_found"); // a malformed id can't exist: treat as not found

/** Builds { kcal: schema, protein: schema, ... } from the nutrient list. */
function perNutrient<S extends z.ZodType>(make: () => S): Record<NutrientKey, S> {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, make()])) as Record<
    NutrientKey,
    S
  >;
}

/**
 * An ingredient form. Price is typed in euros ("1,89"); it is converted to
 * integer cents here, the only place that knows about that conversion.
 */
export const ingredientInput = z
  .object({
    name,
    description: z.string().trim().max(500, "too_long"),
    unit: z.enum(INGREDIENT_UNITS, "invalid_choice"),
    ...perNutrient(() => decimalString(NUTRIENT)),
    packagePrice: optionalDecimalString({ scale: 2, max: "99999" }),
    packageSize: optionalDecimalString(QUANTITY),
  })
  .transform((v, ctx) => {
    // Price needs both parts: "1.89 €" alone doesn't say for how much.
    if ((v.packagePrice === null) !== (v.packageSize === null)) {
      ctx.addIssue({ code: "custom", message: "price_pair", path: ["packagePrice"] });
      return z.NEVER;
    }
    if (v.packageSize !== null && new Big(v.packageSize).eq(0)) {
      ctx.addIssue({ code: "custom", message: "not_positive", path: ["packageSize"] });
      return z.NEVER;
    }
    const { packagePrice, ...rest } = v;
    return {
      ...rest,
      // "1.89" euros -> 189 cents. Exact: Big, and scale ≤ 2 was checked above.
      packagePriceCents:
        packagePrice === null ? null : new Big(packagePrice).times(100).toNumber(),
    };
  });
export type IngredientInput = z.output<typeof ingredientInput>;

/** A meal form: name, notes, and at least one ingredient line. */
export const mealInput = z.object({
  name,
  notes: z.string().trim().max(1000, "too_long"),
  items: z
    .array(
      z.object({
        ingredientId: id,
        quantity: decimalString({ ...QUANTITY, positive: true }),
      }),
    )
    .min(1, "empty_meal"),
});
export type MealInput = z.output<typeof mealInput>;

const day = z.string().refine(isValidDay, "invalid_day");

/** The "Planned" checkbox: browsers send "on" when ticked, nothing otherwise. */
const planned = z
  .string()
  .optional()
  .transform((v) => v === "on");
/** Optional clock time "HH:MM"; empty = not given (ADR-0009). */
const time = z
  .string()
  .optional()
  .transform((v) => (v ?? "").trim())
  .refine((v) => v === "" || isValidTime(v), "invalid_time")
  .transform((v) => (v === "" ? null : v));

/** "I ate (or plan to eat) N servings of this meal on this day." */
export const logMealInput = z.object({
  day,
  mealId: id,
  servings: decimalString(SERVINGS),
  planned,
  time,
});
export type LogMealInput = z.output<typeof logMealInput>;

/** "I ate this quantity of this single ingredient on this day." */
export const logIngredientInput = z.object({
  day,
  ingredientId: id,
  quantity: decimalString({ ...QUANTITY, positive: true }),
  planned,
  time,
});

/** Empty field -> "0": an estimate may leave some macros out. */
const optionalZero = (opts: { scale: number; max: string }) =>
  z
    .string()
    .optional()
    .transform((raw) => (raw ?? "").trim() || "0")
    .pipe(decimalString(opts));

/**
 * An "estimated meal" (ADR-0009): something eaten that can't be described
 * with ingredients, with approximate totals typed by hand. Energy is
 * required; the rest may be left empty (counted as 0). Cost in euros.
 */
export const estimateInput = z.object({
  day,
  label: name,
  kcal: decimalString(NUTRIENT),
  protein: optionalZero(NUTRIENT),
  carbs: optionalZero(NUTRIENT),
  fat: optionalZero(NUTRIENT),
  fiber: optionalZero(NUTRIENT),
  cost: optionalDecimalString({ scale: 2, max: "99999" }),
  planned,
  time,
});
export type EstimateInput = z.output<typeof estimateInput>;

/** Editing an entry's time (the entry id is bound by the page). */
export const entryTimeInput = z.object({ time });
export type LogIngredientInput = z.output<typeof logIngredientInput>;

/** Settings form: time zone and language (targets moved to profiles, ADR-0008). */
export const settingsInput = z.object({
  timezone: z.string().refine(isValidTimeZone, "invalid_choice"),
  locale: z.enum(LOCALES, "invalid_choice"),
});
export type SettingsInput = z.output<typeof settingsInput>;

/** A day profile: a name and optional daily targets (empty = no target). */
export const profileInput = z.object({
  name: z.string().trim().min(1, "required").max(60, "too_long"),
  ...perNutrient(() => optionalDecimalString(NUTRIENT)),
});
export type ProfileInput = z.output<typeof profileInput>;

/** "This day follows this profile." */
export const dayProfileInput = z.object({ day, profileId: id });
export type DayProfileInput = z.output<typeof dayProfileInput>;

/** An id coming from a form or URL (delete buttons, edit pages). */
export const idInput = id;

/**
 * Runs a schema and converts zod's issues into our FieldErrors.
 * Path ["items", 2, "quantity"] becomes the key "items.2.quantity"; a
 * top-level problem becomes "_form". Only the first error per field is kept.
 */
export function parseInput<S extends z.ZodType>(
  schema: S,
  data: unknown,
): { ok: true; value: z.output<S> } | { ok: false; errors: FieldErrors } {
  const parsed = schema.safeParse(data);
  if (parsed.success) return { ok: true, value: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    // Our codes pass through; zod's own English messages (e.g. a field that
    // is missing entirely) are mapped to "required".
    const code = (ERROR_CODES as readonly string[]).includes(issue.message)
      ? (issue.message as ErrorCode)
      : "required";
    errors[key] ??= code;
  }
  return { ok: false, errors };
}

/**
 * The inverse of `ingredientInput`: a stored ingredient as form field values
 * (for the edit page). "12.300" -> "12.3", 189 cents -> "1.89".
 */
export function ingredientFormValues(
  row: {
    name: string;
    description: string;
    unit: string;
    packagePriceCents: number | null;
    packageSize: string | null;
  } & Record<NutrientKey, string>,
): Record<string, string> {
  const values: Record<string, string> = {
    name: row.name,
    description: row.description,
    unit: row.unit,
    packagePrice:
      row.packagePriceCents === null
        ? ""
        : new Big(row.packagePriceCents).div(100).toString(),
    packageSize: row.packageSize === null ? "" : new Big(row.packageSize).toString(),
  };
  for (const k of NUTRIENT_KEYS) values[k] = new Big(row[k]).toString();
  return values;
}

/** Settings as form field values. */
export function settingsFormValues(s: {
  timezone: string;
  locale: string;
}): Record<string, string> {
  return { timezone: s.timezone, locale: s.locale };
}

/** A profile as form field values: targets as plain decimals, empty when unset. */
export function profileFormValues(
  p: {
    name: string;
  } & Record<NutrientKey, string | null>,
): Record<string, string> {
  const values: Record<string, string> = { name: p.name };
  for (const k of NUTRIENT_KEYS) {
    const v = p[k];
    values[k] = v === null ? "" : new Big(v).toString();
  }
  return values;
}
