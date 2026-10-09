/**
 * core/shared/result.ts — how core reports EXPECTED failures (bad input,
 * duplicate name, not found) without throwing and without user-facing text.
 *
 * The error-handling design decided in S01 (ARCHITECTURE.md said "decided with
 * the first slice"):
 *   - Expected failures are VALUES: functions return `Result`, callers must
 *     look at `ok`. TypeScript forces the check before `value` is usable.
 *   - They carry machine CODES ("duplicate_name"), never sentences. The UI
 *     translates codes via i18n (`errors` section of messages.*.ts), so no
 *     user-facing string lives in core/ (ADR-0002 rule 3).
 *   - UNEXPECTED failures (database down, a bug) are thrown exceptions and
 *     end up in Next.js' error boundary (src/app/(app)/error.tsx).
 */

/** Every expected error the app knows. Each needs a label in i18n. */
export const ERROR_CODES = [
  "required",
  "too_long",
  "invalid_number",
  "too_many_decimals",
  "too_large",
  "not_positive",
  "invalid_choice",
  "price_pair",
  "duplicate_name",
  "not_found",
  "in_use",
  "empty_meal",
  "invalid_day",
  "is_default",
  "invalid_time",
  "moments_order",
  "still_referenced",
  "not_editable",
  "future_day",
  "past_day",
  "implausible_weight",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * Field name -> error code. Field names match the form inputs' `name`
 * attributes ("name", "kcal", "items.2.quantity"); "_form" means "the form as
 * a whole".
 */
export type FieldErrors = Record<string, ErrorCode>;

export type Result<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = (errors: FieldErrors): { ok: false; errors: FieldErrors } => ({
  ok: false,
  errors,
});

/**
 * Postgres reports constraint violations with standard SQLSTATE codes. Drizzle
 * may wrap the driver error, so we look at the error and at its `cause`.
 *   23505 unique_violation       -> e.g. duplicate ingredient name
 *   23503 foreign_key_violation  -> a referenced row is missing/still used
 *   23001 restrict_violation     -> ON DELETE RESTRICT refused a delete
 *                                   (found by ingredients.test.ts: RESTRICT
 *                                   does NOT report 23503, as one might assume)
 */
export function pgErrorCode(e: unknown): string | undefined {
  const codeOf = (x: unknown) =>
    typeof x === "object" && x !== null && "code" in x && typeof x.code === "string"
      ? x.code
      : undefined;
  const cause = typeof e === "object" && e !== null && "cause" in e ? e.cause : undefined;
  return codeOf(e) ?? codeOf(cause);
}

/**
 * What a form's server action returns to the form (React's useActionState).
 * "idle" before the first submit; "error" with codes per field; "saved".
 * Plain data, because it travels from server to browser.
 *
 * `values` on error: React 19 resets a form after its action completes, which
 * would wipe what the user typed. The action sends the submitted values back,
 * and forms use them as the fields' default values, so a typo in one field
 * doesn't cost re-typing the other twelve.
 */
export type FormState =
  | { status: "idle" }
  | { status: "error"; errors: FieldErrors; values: Record<string, string> }
  | { status: "saved" };

/** The value a field should show: what was just submitted, else the initial one. */
export function valueOf(state: FormState, field: string, initial = ""): string {
  return state.status === "error" ? (state.values[field] ?? initial) : initial;
}

export const IDLE: FormState = { status: "idle" };

/**
 * The translated error for one field, or undefined. The dictionary is passed
 * in (core may not import i18n/): `fieldError(state, "name", t.errors)`.
 */
export function fieldError(
  state: FormState,
  field: string,
  dictionary: Record<ErrorCode, string>,
): string | undefined {
  if (state.status !== "error") return undefined;
  const code = state.errors[field];
  return code ? dictionary[code] : undefined;
}
