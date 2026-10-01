/**
 * core/energy/validation.ts — what the energy forms may send (ADR-0014):
 * the body data in Settings, and the day's activity on the day page.
 * Empty fields mean "not given" (null), never a guess.
 */
import { z } from "zod";
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
