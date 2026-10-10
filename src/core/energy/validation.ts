/**
 * core/energy/validation.ts — what the energy forms may send (ADR-0014):
 * the body data and the goal in Settings, and the day's activity on the day page.
 * Empty fields mean "not given" (null), never a guess.
 */
import { z } from "zod";
import { DIET_SPLITS, KCAL_FLOORS, PROTEIN_PREFERENCES } from "../db/schema/goals";
import { CORRECTION_RANGE } from "./calibration";
import { LEVELS } from "./energy";

/** A whole number in [min, max], or null when the field is empty. */
const optionalInt = (min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      const raw = (v ?? "").trim();
      if (raw === "") return null;
      const n = Number(raw);
      if (!Number.isInteger(n)) {
        ctx.addIssue({ code: "custom", message: "invalid_number" });
        return z.NEVER;
      }
      if (n < min || n > max) {
        ctx.addIssue({ code: "custom", message: n < min ? "not_positive" : "too_large" });
        return z.NEVER;
      }
      return n;
    });

export const bodyInput = z.object({
  sex: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.enum(["male", "female"], "invalid_choice").nullable()),
  birthYear: optionalInt(1900, 2100),
  heightCm: optionalInt(100, 250),
});
export type BodyInput = z.infer<typeof bodyInput>;

export const activityInput = z.object({
  level: z.enum(LEVELS, "invalid_choice"),
  walkingMin: optionalInt(0, 1440),
  steps: optionalInt(0, 100000),
});
export type ActivityInput = z.infer<typeof activityInput>;

/** ADR-0020: an accepted calibration factor (1 = reset), kept to two decimals. */
export const correctionInput = z
  .number()
  .min(CORRECTION_RANGE[0])
  .max(CORRECTION_RANGE[1])
  .transform((n) => Math.round(n * 100) / 100);

/** ADR-0043: a decimal in [min, max], comma or point, kept to two decimals. */
const signedDecimal = (min: number, max: number) =>
  z.string().transform((v, ctx) => {
    const n = Number(v.trim().replace(",", "."));
    if (v.trim() === "" || !Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "invalid_number" });
      return z.NEVER;
    }
    if (n < min || n > max) {
      ctx.addIssue({ code: "custom", message: n < min ? "not_positive" : "too_large" });
      return z.NEVER;
    }
    return n.toFixed(2);
  });

/** ADR-0043: the goal, from Settings. */
export const goalInput = z.object({
  ratePctWeek: signedDecimal(-1.5, 1),
  targetKg: z
    .string()
    .optional()
    .transform((v) => ((v ?? "").trim() === "" ? null : v!))
    .pipe(signedDecimal(30, 300).nullable()),
  kcalFloor: z.enum(KCAL_FLOORS, "invalid_choice"),
  protein: z.enum(PROTEIN_PREFERENCES, "invalid_choice"),
  split: z.enum(DIET_SPLITS, "invalid_choice"),
  checkInWeekday: z.coerce.number().int("invalid_choice").min(0).max(6),
});
export type GoalInput = z.infer<typeof goalInput>;
