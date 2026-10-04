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
import { Big } from "../shared/decimal";
import { isValidTime, isValidTimeZone } from "../shared/dates";
import {
  day,
  decimalString,
  id,
  jsonField,
  optionalDecimalString,
  parseInput,
  time,
} from "../shared/validation";
import { INGREDIENT_UNITS } from "../db/schema/nutrition";
import { NUTRIENT_KEYS, type NutrientKey } from "./nutrients";
import { LOCALES } from "../shared/locales";
import { THEMES } from "../shared/themes";
import { PER, SORTS } from "./metrics";
import {
  isFiberType,
  isOrigin,
  TAG_ICONS,
  type FiberType,
  type Nova,
  type Origin,
} from "./quality";
import { isMoment, minutesOf, type Moment } from "./moments";
import type { TrendRange } from "./preferences";

// Column limits, mirrored from core/db/schema/nutrition.ts.
const NUTRIENT = { scale: 3, max: "9999999" }; // numeric(10,3)
const QUANTITY = { scale: 2, max: "99999999" }; // numeric(10,2)
const SERVINGS = { scale: 2, max: "9999", positive: true }; // numeric(6,2)

const name = z.string().trim().min(1, "required").max(120, "too_long");

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
/** Empty = not classified; else one of the closed list (ADR-0012). */
const optionalNova = z
  .string()
  .optional()
  .transform((v) => (v ?? "").trim())
  .refine((v) => v === "" || ["1", "2", "3", "4"].includes(v), "invalid_choice")
  .transform((v) => (v === "" ? null : (Number(v) as Nova)));
const optionalOrigin = z
  .string()
  .optional()
  .transform((v) => (v ?? "").trim())
  .refine((v) => v === "" || isOrigin(v), "invalid_choice")
  .transform((v) => (v === "" ? null : (v as Origin)));
/** Comma-separated fibre types ("inulin_fos,pectin"), each from the list. */
const fiberTypesField = z
  .string()
  .optional()
  .transform((v) => [
    ...new Set(
      (v ?? "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ])
  .refine((xs) => xs.every(isFiberType), "invalid_choice")
  .transform((xs) => xs as FiberType[]);
/**
 * Free tags as JSON ([{"name":"Lidl","icon":"store"}]), sent by the editor
 * in a hidden field. Absent = leave the ingredient's tags as they are.
 */
const tagsField = jsonField(
  z
    .array(
      z.object({
        name: z.string().trim().min(1, "required").max(40, "too_long"),
        icon: z.enum(TAG_ICONS, "invalid_choice"),
      }),
    )
    .max(20, "too_long"),
);

export const ingredientInput = z
  .object({
    name,
    description: z.string().trim().max(500, "too_long"),
    unit: z.enum(INGREDIENT_UNITS, "invalid_choice"),
    ...perNutrient(() => decimalString(NUTRIENT)),
    packagePrice: optionalDecimalString({ scale: 2, max: "99999" }),
    packageSize: optionalDecimalString(QUANTITY),
    // ADR-0012: quality attributes and free tags.
    nova: optionalNova,
    origin: optionalOrigin,
    fiberTypes: fiberTypesField,
    tags: tagsField,
    // ADR-0039: active compounds per 100 g/ml. Empty = none; absent (a form
    // without these fields) = leave them as they are.
    caffeineMg: z.string().pipe(optionalDecimalString(NUTRIENT)).optional(),
    creatineG: z.string().pipe(optionalDecimalString(NUTRIENT)).optional(),
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

/**
 * A moment of the day (ADR-0011) or empty: an empty field means "not set"
 * (the day view then derives it from the time).
 */
const optionalMoment = z
  .string()
  .optional()
  .transform((v) => (v ?? "").trim())
  .refine((v) => v === "" || isMoment(v), "invalid_choice")
  .transform((v) => (v === "" ? null : (v as Moment)));

/** A meal form: name, notes, and at least one ingredient line. */
export const mealInput = z.object({
  name,
  notes: z.string().trim().max(1000, "too_long"),
  category: optionalMoment, // ADR-0011: only a hint for new entries
  // ADR-0012: notes next to the ratings, and the scores as JSON
  // ([{"factorId":"…","score":4}]) from a hidden field; absent = keep.
  review: z.string().trim().max(2000, "too_long").optional(),
  ratings: jsonField(
    z.array(z.object({ factorId: id, score: z.number().int().min(1).max(5) })),
  ),
  items: z
    .array(
      z.object({
        ingredientId: id,
        quantity: decimalString({ ...QUANTITY, positive: true }),
      }),
    )
    .min(1, "empty_meal"),
});
/**
 * ADR-0022: a day's entry edited as a local copy. A line with `itemId`
 * keeps its snapshot (a different `ingredientId` swaps it); a line without
 * one adds an ingredient.
 */
export const entryLinesInput = z.object({
  servings: decimalString({ ...SERVINGS, positive: true }),
  items: z
    .array(
      z
        .object({
          itemId: id.optional(),
          ingredientId: id.optional(),
          quantity: decimalString({ ...QUANTITY, positive: true }),
        })
        .refine((l) => l.itemId || l.ingredientId, {
          message: "required",
          path: ["ingredientId"],
        }),
    )
    .min(1, "empty_meal"),
});
export type EntryLinesInput = z.output<typeof entryLinesInput>;

export type MealInput = z.output<typeof mealInput>;

/**
 * The meal form's fields (strings) as mealInput reads them: every key of
 * the schema, the lines parsed from their JSON field. Kept next to the
 * schema so a new field can't be forgotten (it was: category, review and
 * ratings were never read until 2026-10-01; validation.test.ts checks).
 */
export function mealFormData(values: Record<string, string | undefined>) {
  let items: unknown;
  try {
    items = values.items === undefined ? undefined : JSON.parse(values.items);
  } catch {
    items = undefined;
  }
  return {
    name: values.name,
    notes: values.notes,
    category: values.category,
    review: values.review,
    ratings: values.ratings,
    items,
  } satisfies Record<keyof typeof mealInput.shape, unknown>;
}

/** The "Planned" checkbox: browsers send "on" when ticked, nothing otherwise. */
const planned = z
  .string()
  .optional()
  .transform((v) => v === "on");

/** "I ate (or plan to eat) N servings of this meal on this day." */
export const logMealInput = z.object({
  day,
  mealId: id,
  servings: decimalString(SERVINGS),
  planned,
  time,
  moment: optionalMoment,
});
export type LogMealInput = z.output<typeof logMealInput>;

/** "I ate N portions of this batch" (ADR-0017): like a meal, from a batch. */
export const logPortionInput = logMealInput
  .omit({ mealId: true })
  .extend({ batchId: id });
export type LogPortionInput = z.output<typeof logPortionInput>;

/** "I ate this quantity of this single ingredient on this day." */
export const logIngredientInput = z.object({
  day,
  ingredientId: id,
  quantity: decimalString({ ...QUANTITY, positive: true }),
  planned,
  time,
  moment: optionalMoment,
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
  sugars: optionalZero(NUTRIENT),
  fat: optionalZero(NUTRIENT),
  saturatedFat: optionalZero(NUTRIENT),
  fiber: optionalZero(NUTRIENT),
  salt: optionalZero(NUTRIENT),
  cost: optionalDecimalString({ scale: 2, max: "99999" }),
  planned,
  time,
  moment: optionalMoment,
});
export type EstimateInput = z.output<typeof estimateInput>;

/** Editing an entry's time (the entry id is bound by the page). */
export const entryTimeInput = z.object({ time });
/** An entry's multiplier from the day's −/+ (0.25 to 10). */
export const entryServingsInput = z.object({
  servings: z.coerce.number("invalid_number").min(0.25, "too_small").max(10, "too_large"),
});
export type LogIngredientInput = z.output<typeof logIngredientInput>;

/** Settings form: time zone and language (targets moved to profiles, ADR-0008). */
export const settingsInput = z.object({
  timezone: z.string().refine(isValidTimeZone, "invalid_choice"),
  locale: z.enum(LOCALES, "invalid_choice"),
  theme: z.enum(THEMES, "invalid_choice"),
});
export type SettingsInput = z.output<typeof settingsInput>;

/** "HH:MM" -> minutes after midnight; invalid -> "invalid_time". */
const minutesField = z
  .string()
  .refine((v) => isValidTime(v), "invalid_time")
  .transform((v) => minutesOf(v));

/**
 * The preferences form (core/nutrition/preferences.ts). Moment hours must
 * keep their order (lunch after 05:00, before snack, before dinner), the
 * same rule as the database CHECK.
 */
export const preferencesInput = z
  .object({
    autoTargets: z
      .string()
      .optional()
      .transform((v) => v === "on"),
    lunchFrom: minutesField,
    snackFrom: minutesField,
    dinnerFrom: minutesField,
    trendsRange: z
      .enum(["7", "30", "90"], "invalid_choice")
      .transform((v) => Number(v) as TrendRange),
    listSort: z.enum(SORTS, "invalid_choice"),
    listPer: z.enum(PER, "invalid_choice"),
  })
  .superRefine((v, ctx) => {
    if (v.lunchFrom < 300 || v.snackFrom <= v.lunchFrom)
      ctx.addIssue({ code: "custom", path: ["snackFrom"], message: "moments_order" });
    if (v.dinnerFrom <= v.snackFrom)
      ctx.addIssue({ code: "custom", path: ["dinnerFrom"], message: "moments_order" });
  });
export type PreferencesInput = z.output<typeof preferencesInput>;

/** A rating factor ("Gusto", "Sazietà"…), ADR-0012. */
export const factorInput = z.object({
  name: z.string().trim().min(1, "required").max(40, "too_long"),
});

/** A day profile: a name and optional daily targets (empty = no target). */
export const profileInput = z.object({
  name: z.string().trim().min(1, "required").max(60, "too_long"),
  ...perNutrient(() => optionalDecimalString(NUTRIENT)),
  // ADR-0014: "dynamic" derives the targets from the day's energy; the
  // fixed targets above are then ignored. Absent = fixed (older forms).
  mode: z.enum(["fixed", "dynamic"], "invalid_choice").default("fixed"),
  // kcal/day below expenditure; negative = surplus (muscle gain).
  deficitKcal: z
    .string()
    .optional()
    .transform((v, ctx) => {
      const raw = (v ?? "").trim() || "0";
      const n = Number(raw);
      if (!Number.isInteger(n)) {
        ctx.addIssue({ code: "custom", message: "invalid_number" });
        return z.NEVER;
      }
      if (Math.abs(n) > 1500) {
        ctx.addIssue({ code: "custom", message: "too_large" });
        return z.NEVER;
      }
      return n;
    }),
  proteinGPerKg: z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim() || "1.8")
    .pipe(decimalString({ scale: 1, max: "4" })),
  fatGPerKg: z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim() || "0.8")
    .pipe(decimalString({ scale: 1, max: "3" })),
});
export type ProfileInput = z.output<typeof profileInput>;

/** "This day follows this profile." */
export const dayProfileInput = z.object({ day, profileId: id });

/**
 * The day page's goal line (2026-10-02): change a dynamic day type's
 * deficit there; positive = deficit, negative = surplus, ±1500 at most.
 */
export const goalDeficitInput = z.object({
  day,
  profileId: id,
  deficitKcal: z.coerce
    .number("invalid_number")
    .int("invalid_number")
    .min(-1500, "too_large")
    .max(1500, "too_large"),
});
export type GoalDeficitInput = z.output<typeof goalDeficitInput>;
export type DayProfileInput = z.output<typeof dayProfileInput>;

/** An id coming from a form or URL (delete buttons, edit pages). */
export const idInput = id;

// Re-exported: the app imports parseInput from here (one import per form).
export { parseInput };

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
    nova?: number | null;
    origin?: string | null;
    fiberTypes?: readonly string[];
    /** ADR-0039: active compounds per 100. */
    caffeineMg?: string | null;
    creatineG?: string | null;
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
    // ADR-0012: "" = not classified.
    nova: row.nova == null ? "" : String(row.nova),
    origin: row.origin ?? "",
    fiberTypes: (row.fiberTypes ?? []).join(","),
    caffeineMg: row.caffeineMg ? new Big(row.caffeineMg).toString() : "",
    creatineG: row.creatineG ? new Big(row.creatineG).toString() : "",
  };
  for (const k of NUTRIENT_KEYS) values[k] = new Big(row[k]).toString();
  return values;
}

/** Settings as form field values. */
export function settingsFormValues(s: {
  timezone: string;
  locale: string;
  theme: string;
}): Record<string, string> {
  return { timezone: s.timezone, locale: s.locale, theme: s.theme };
}

/** A profile as form field values: targets as plain decimals, empty when unset. */
export function profileFormValues(
  p: {
    name: string;
    mode?: string;
    deficitKcal?: number;
    proteinGPerKg?: string;
    fatGPerKg?: string;
  } & Record<NutrientKey, string | null>,
): Record<string, string> {
  const values: Record<string, string> = {
    name: p.name,
    // ADR-0014: the dynamic parameters, as typed (decimals without trailing zeros).
    mode: p.mode ?? "fixed",
    deficitKcal: String(p.deficitKcal ?? 0),
    proteinGPerKg: new Big(p.proteinGPerKg ?? "1.8").toString(),
    fatGPerKg: new Big(p.fatGPerKg ?? "0.8").toString(),
  };
  for (const k of NUTRIENT_KEYS) {
    const v = p[k];
    values[k] = v === null ? "" : new Big(v).toString();
  }
  return values;
}
