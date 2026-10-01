/**
 * core/training/validation.ts — what training input is acceptable (ADR-0005).
 * Same flow as nutrition: a server action turns FormData into an object,
 * `parseInput(schema, data)` gives typed values or FieldErrors.
 *
 * A set's columns depend on its exercise's KIND, which the form doesn't
 * know for sure; `checkSetsForKinds` applies those rules once the
 * repository has looked up the exercises (errors keyed like the form:
 * "exercises.2.sets.1.reps").
 */
import { z } from "zod";
import type { FieldErrors } from "../shared/result";
import {
  day,
  decimalString,
  id,
  jsonField,
  optionalDecimalString,
  time,
} from "../shared/validation";
import { isMovementPattern, isMuscleGroup } from "./anatomy";
import {
  EXERCISE_KINDS,
  INTENSITIES,
  SESSION_STATUSES,
  type ExerciseKind,
  type Intensity,
} from "./kinds";

const name = z.string().trim().min(1, "required").max(80, "too_long");
const LOAD = { scale: 2, max: "9999" }; // numeric(6,2)
const TENTH = { scale: 1, max: "999" }; // numeric(4,1)

/**
 * "lats,biceps" -> ["lats", "biceps"]: keys of the closed list
 * (anatomy.ts), in the order chosen (the first is the primary group).
 */
const muscleGroups = z
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
  .refine((xs) => xs.every(isMuscleGroup), "invalid_choice");

/** "" -> null (not classified yet). */
const pattern = z
  .string()
  .optional()
  .transform((v) => v || null)
  .refine((v) => v === null || isMovementPattern(v), "invalid_choice");

export const exerciseInput = z.object({
  name,
  kind: z.enum(EXERCISE_KINDS, "invalid_choice"),
  muscleGroups,
  pattern,
  equipment: z
    .string()
    .optional()
    .transform((v) => (v ?? "").trim() || null)
    .refine((v) => v === null || v.length <= 40, "too_long"),
  unilateral: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  notes: z.string().trim().max(500, "too_long").optional().default(""),
});
export type ExerciseInput = z.output<typeof exerciseInput>;

/** Optional positive whole number (reps, seconds, metres). */
const optionalCount = z.number().int().positive().max(100000).nullable().optional();

/** One set, as the session editor sends it (numbers as numbers, decimals as strings). */
const setInput = z.object({
  reps: optionalCount,
  loadKg: z.string().optional().default("").pipe(optionalDecimalString(LOAD)),
  loadText: z
    .string()
    .trim()
    .max(40, "too_long")
    .optional()
    .transform((v) => v || null),
  loadApprox: z.boolean().optional().default(false),
  durationS: optionalCount,
  distanceM: optionalCount,
  speedKmh: z.string().optional().default("").pipe(optionalDecimalString(TENTH)),
  inclinePct: z.string().optional().default("").pipe(optionalDecimalString(TENTH)),
  restS: optionalCount,
  warmup: z.boolean().optional().default(false),
  /** Live mode: false while a planned set is not ticked yet; absent = done. */
  done: z.boolean().optional(),
});
export type SetInput = z.output<typeof setInput>;

const sessionExerciseInput = z.object({
  exerciseId: id,
  restS: optionalCount,
  notes: z.string().trim().max(500, "too_long").optional().default(""),
  sets: z.array(setInput).max(30, "too_long"),
});

export const sessionInput = z
  .object({
    day,
    label: name,
    status: z.enum(SESSION_STATUSES, "invalid_choice"),
    /** Start "HH:MM" in the user's zone; empty = unknown. */
    time,
    durationMin: z
      .string()
      .optional()
      .transform((v) => (v ?? "").trim())
      .refine((v) => v === "" || /^\d{1,3}$/.test(v), "invalid_number")
      .transform((v) => (v === "" || v === "0" ? null : Number(v))),
    notes: z.string().trim().max(2000, "too_long").optional().default(""),
    routineId: z
      .string()
      .optional()
      .transform((v) => v || null)
      .pipe(id.nullable()),
    exercises: jsonField(z.array(sessionExerciseInput).max(40, "too_long")).transform(
      (v) => v ?? [],
    ),
    // ADR-0016: an estimated session (no exercises). "" = not set.
    intensity: z
      .string()
      .optional()
      .transform((v) => v || null)
      .refine(
        (v) => v === null || (INTENSITIES as readonly string[]).includes(v),
        "invalid_choice",
      )
      .transform((v) => v as Intensity | null),
    kcalEstimate: z
      .string()
      .optional()
      .transform((v) => (v ?? "").trim())
      .refine((v) => v === "" || /^\d{1,5}$/.test(v), "invalid_number")
      .transform((v) => (v === "" ? null : Number(v)))
      .refine((v) => v !== 0, "not_positive")
      .refine((v) => v === null || v <= 10000, "too_large"),
    muscleGroups,
  })
  .superRefine((s, ctx) => {
    // An estimate says how much: minutes (with its intensity) or kcal.
    if (s.exercises.length === 0 && s.intensity && !s.durationMin && !s.kcalEstimate)
      ctx.addIssue({ code: "custom", path: ["durationMin"], message: "required" });
  });
type SessionOutput = z.output<typeof sessionInput>;
/** A session to save; the estimate fields (ADR-0016) may be left out (importers, tests). */
export type SessionInput = Omit<
  SessionOutput,
  "intensity" | "kcalEstimate" | "muscleGroups"
> &
  Partial<Pick<SessionOutput, "intensity" | "kcalEstimate" | "muscleGroups">>;

/** A body measurement (weight required; the rest optional). */
export const measurementInput = z.object({
  day,
  weightKg: decimalString({ scale: 2, max: "999", positive: true }),
  bodyFatPct: optionalDecimalString(TENTH),
  waistCm: optionalDecimalString(TENTH),
  notes: z.string().trim().max(500, "too_long").optional().default(""),
});
export type MeasurementInput = z.output<typeof measurementInput>;

/**
 * The rules a set's kind imposes: strength needs reps and a load;
 * bodyweight needs reps (a load is optional, e.g. a vest); cardio needs a
 * duration. `kinds[i]` is the kind of `exercises[i]`.
 */
export function checkSetsForKinds(
  exercises: readonly {
    sets: readonly Pick<SetInput, "reps" | "loadKg" | "durationS">[];
  }[],
  kinds: readonly ExerciseKind[],
): FieldErrors | null {
  const errors: FieldErrors = {};
  exercises.forEach((e, i) =>
    e.sets.forEach((s, j) => {
      const at = `exercises.${i}.sets.${j}`;
      const kind = kinds[i]!;
      if (kind !== "cardio" && s.reps == null) errors[`${at}.reps`] = "required";
      if (kind === "strength" && s.loadKg === null) errors[`${at}.loadKg`] = "required";
      if (kind === "cardio" && s.durationS == null)
        errors[`${at}.durationS`] = "required";
    }),
  );
  return Object.keys(errors).length ? errors : null;
}

/** A routine (template session): a name and its exercises with defaults. */
export const routineInput = z.object({
  name,
  notes: z.string().trim().max(1000, "too_long").optional().default(""),
  items: jsonField(
    z
      .array(
        z.object({
          exerciseId: id,
          sets: z.number().int().min(1).max(20),
          reps: optionalCount,
          loadKg: z.string().optional().default("").pipe(optionalDecimalString(LOAD)),
          durationS: optionalCount,
          restS: optionalCount,
        }),
      )
      .max(40, "too_long"),
  ).transform((v) => v ?? []),
});
export type RoutineInput = z.output<typeof routineInput>;
