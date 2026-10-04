/**
 * core/catalog/pack.ts — a PACK (ADR-0034): exercises, routines, programs,
 * ingredients and meals to ADD to an account; and ESTIMATES, which add no
 * record to the catalog: they become planned estimated entries (ADR-0009)
 * on one day, e.g. a restaurant's menu to choose from tonight. The starter pack every new
 * account gets is one (./starter.ts); a file imported from Settings is
 * another (e.g. the developer's personal expansion, made from their export
 * and never committed).
 * PURE: validation only. Writing is ./apply.ts.
 *
 * Records point at each other BY NAME ("Push" → "Panca piana"), not by id:
 * a pack is written by hand and read by people, and a name may match a
 * record the account already has. Every number has the scale its column
 * stores (as in core/import/lifeos.ts), so nothing is rounded silently.
 */
import { z } from "zod";
import { MOMENTS } from "../nutrition/moments";
import { day } from "../shared/validation";
import { FIBER_TYPES, ORIGINS } from "../nutrition/quality";
import { ERROR_CODES, fail, ok, type ErrorCode, type Result } from "../shared/result";
import { EXERCISE_KINDS } from "../training/kinds";
import { isMovementPattern, isMuscleGroup } from "../training/anatomy";

/** "12.300" with at most `scale` decimals (no sign, no exponent). */
const dec = (scale: number) =>
  z.string().regex(new RegExp(`^\\d{1,7}(\\.\\d{1,${scale}})?$`), "invalid_number");
const nutrient = dec(3);
const name = z.string().trim().min(1).max(120);
const count = z.number().int().positive().max(100000);

export const PACK_VERSION = 1;

const exercise = z.object({
  name,
  kind: z.enum(EXERCISE_KINDS),
  /** The main group first; the others count half a set (core/training/anatomy). */
  muscleGroups: z.array(z.string().refine(isMuscleGroup, "invalid_choice")).default([]),
  pattern: z
    .string()
    .refine(isMovementPattern, "invalid_choice")
    .nullable()
    .default(null),
  equipment: z.string().trim().max(40).nullable().default(null),
  unilateral: z.boolean().default(false),
  /** How to do it and what to avoid: shown on the exercise's page. */
  notes: z.string().trim().max(500).default(""),
});

const routine = z.object({
  name,
  notes: z.string().trim().max(1000).default(""),
  items: z
    .array(
      z.object({
        exercise: name,
        sets: z.number().int().min(1).max(20),
        reps: count.nullable().default(null),
        loadKg: dec(2).nullable().default(null),
        durationS: count.nullable().default(null),
        restS: count.nullable().default(null),
      }),
    )
    .min(1)
    .max(40),
});

const program = z.object({
  name,
  notes: z.string().trim().max(1000).default(""),
  /** A routine, one exercise, or a rest day (a label). */
  slots: z
    .array(
      z
        .object({
          routine: name.optional(),
          exercise: name.optional(),
          label: z.string().trim().max(40).default(""),
        })
        .refine((s) => !(s.routine && s.exercise), "invalid_choice"),
    )
    .min(1)
    .max(28),
});

const ingredient = z.object({
  name,
  description: z.string().trim().max(500).default(""),
  unit: z.enum(["g", "ml"]).default("g"),
  // Per 100 g or 100 ml, as on a label.
  kcal: nutrient,
  protein: nutrient,
  carbs: nutrient,
  sugars: nutrient,
  fat: nutrient,
  saturatedFat: nutrient,
  fiber: nutrient,
  salt: nutrient,
  nova: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .nullable()
    .default(null),
  origin: z.enum(ORIGINS).nullable().default(null),
  fiberTypes: z.array(z.enum(FIBER_TYPES)).default([]),
  /** ADR-0039: active compounds per 100 g/ml (mg caffeine, g creatine). */
  caffeineMg: nutrient.nullable().default(null),
  creatineG: nutrient.nullable().default(null),
});

const meal = z.object({
  name,
  notes: z.string().trim().max(1000).default(""),
  category: z.enum(MOMENTS).nullable().default(null),
  items: z
    .array(z.object({ ingredient: name, quantity: dec(2) }))
    .min(1)
    .max(60),
});

/** One dish as a whole portion: totals, not per 100 g. Empty nutrients are 0. */
const estimate = z.object({
  name,
  moment: z.enum(MOMENTS).nullable().default(null),
  kcal: nutrient,
  protein: nutrient.default("0"),
  carbs: nutrient.default("0"),
  sugars: nutrient.default("0"),
  fat: nutrient.default("0"),
  saturatedFat: nutrient.default("0"),
  fiber: nutrient.default("0"),
  salt: nutrient.default("0"),
  /** What it costs, in euros ("12.50"). */
  cost: dec(2).nullable().default(null),
});

export const packSchema = z.object({
  format: z.literal("lifeos-pack"),
  version: z.literal(PACK_VERSION),
  name,
  description: z.string().trim().max(2000).default(""),
  /** Where the numbers and the advice come from. */
  sources: z.array(z.string().trim().max(300)).default([]),
  exercises: z.array(exercise).default([]),
  routines: z.array(routine).default([]),
  programs: z.array(program).default([]),
  ingredients: z.array(ingredient).default([]),
  meals: z.array(meal).default([]),
  /** The day the estimates go on; null = the importer's today. */
  day: day.nullable().default(null),
  estimates: z.array(estimate).max(100).default([]),
});
export type Pack = z.output<typeof packSchema>;
/** What a pack is written as (defaults may be left out). */
export type PackInput = z.input<typeof packSchema>;

/**
 * A pack from untrusted JSON (a file chosen in Settings). Besides the shape:
 * no two records of a kind share a name (after normalising), or applying it
 * would depend on the order.
 */
export function parsePack(json: unknown): Result<Pack> {
  const r = packSchema.safeParse(json);
  if (!r.success) {
    const issue = r.error.issues[0]!;
    // Our own codes pass through; zod's own messages become "invalid_choice".
    const code = (ERROR_CODES as readonly string[]).includes(issue.message)
      ? (issue.message as ErrorCode)
      : "invalid_choice";
    return fail({ [issue.path.join(".") || "_form"]: code });
  }
  const p = r.data;
  for (const kind of [
    "exercises",
    "routines",
    "programs",
    "ingredients",
    "meals",
    "estimates",
  ] as const) {
    const seen = new Set<string>();
    for (const [i, x] of p[kind].entries()) {
      const key = nameKey(x.name);
      if (seen.has(key)) return fail({ [`${kind}.${i}.name`]: "duplicate_name" });
      seen.add(key);
    }
  }
  return ok(p);
}

/** How names are compared: case, accents, spaces and punctuation ignored. */
export function nameKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export const PACK_KINDS = [
  "exercises",
  "routines",
  "programs",
  "ingredients",
  "meals",
  "estimates",
] as const;
export type PackKind = (typeof PACK_KINDS)[number];

export type ApplyReport = {
  added: Record<PackKind, number>;
  /** Already in the account: left as they are. */
  kept: Record<PackKind, number>;
  /** "Push → Panca piana": a reference found neither in the pack nor in the account. */
  missing: string[];
};
