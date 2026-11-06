/**
 * Edit in place (PAT-13): what leaving a value's field does. The typed text is read the way a
 * form reads it (`readForm`); an error keeps the field open, an unchanged value just closes it,
 * anything else is saved.
 */
import { readForm, type FormFieldSpec, type FormValue } from "./form";

export type InPlaceCommit =
  | { kind: "same" }
  | { kind: "error"; error: string }
  | { kind: "save"; value: FormValue };

export function inPlaceCommit(
  spec: FormFieldSpec,
  raw: string,
  before: FormValue | undefined,
): InPlaceCommit {
  const { values, errors } = readForm([spec], () => raw);
  const error = errors[spec.key];
  if (error) return { kind: "error", error };
  const value = values[spec.key] ?? null;
  return value === (before ?? null) ? { kind: "same" } : { kind: "save", value };
}
