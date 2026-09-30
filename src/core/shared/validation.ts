/**
 * core/shared/validation.ts — the building blocks every domain's validation
 * uses (nutrition, training): decimals typed by people, ids, days, clock
 * times, JSON sent in hidden fields, and parseInput, which turns zod's
 * issues into FieldErrors with our error codes (core/shared/result.ts).
 */
import { z } from "zod";
import { Big, parseDecimalInput } from "./decimal";
import { isValidDay, isValidTime } from "./dates";
import { ERROR_CODES, type ErrorCode, type FieldErrors } from "./result";

/**
 * A decimal typed by a person, e.g. "12,5". Returns the canonical string.
 * `scale` = max digits after the point, matching the DB column. Without this
 * check, Postgres would silently round 1.23456 into numeric(10,3) as 1.235 —
 * a small silent corruption, exactly what PROJECT.md forbids.
 */
export function decimalString(opts: { scale: number; max: string; positive?: boolean }) {
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
export function optionalDecimalString(opts: { scale: number; max: string }) {
  return z
    .string()
    .transform((raw) => (raw.trim() === "" ? null : raw))
    .pipe(decimalString(opts).nullable());
}

/** An id from a form or URL; a malformed one can't exist: "not found". */
export const id = z.uuid("not_found");

/** A calendar day, "YYYY-MM-DD". */
export const day = z.string().refine(isValidDay, "invalid_day");

/** Optional clock time "HH:MM"; empty = not given (ADR-0009). */
export const time = z
  .string()
  .optional()
  .transform((v) => (v ?? "").trim())
  .refine((v) => v === "" || isValidTime(v), "invalid_time")
  .transform((v) => (v === "" ? null : v));

/**
 * JSON sent in a hidden field (editors with a variable number of rows),
 * checked by `inner`. Absent = undefined (the caller decides what that
 * means); invalid JSON = "invalid_choice", never an exception.
 */
export function jsonField<S extends z.ZodType>(inner: S) {
  return z
    .string()
    .optional()
    .transform((raw, ctx) => {
      if (raw === undefined) return undefined;
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "invalid_choice" });
        return z.NEVER;
      }
    })
    .pipe(inner.optional());
}

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
