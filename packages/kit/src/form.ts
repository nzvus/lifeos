/**
 * ObjectForm (PAT-61): a form generated from a type's fields — labels, units, help, ranges;
 * numbers with − / + steppers, a time with its one native picker. Pure: the fields as `Field`
 * props, and the posted values read back and checked against the same declaration, so the
 * page and the server say the same thing.
 */
import type { FieldProps } from "./Field";
import { readRecurrence } from "./recurrence";
import { WORDS } from "./words";

export type FormFieldSpec = {
  key: string;
  label: string;
  type:
    | "number"
    | "integer"
    | "duration"
    | "boolean"
    | "choice"
    | "scale"
    | "text"
    | "time"
    | "date"
    | "recurrence";
  unit?: string;
  min?: number;
  max?: number;
  /** For a scale: its top (5 or 10). */
  scale?: number;
  choices?: readonly { value: string; label: string }[];
  required?: boolean;
  help?: string;
  step?: number;
};

export type FormValue = string | number | boolean | null;

/** A value as the field shows it: numbers with his decimal comma, text untouched. */
const asText = (v: FormValue | undefined): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "yes" : "no";
  return typeof v === "number" ? String(v).replace(".", ",") : v;
};

/** Each declared field as the kit's `Field`. */
export function formFields(
  specs: readonly FormFieldSpec[],
  values: Readonly<Record<string, FormValue>> = {},
  errors: Readonly<Record<string, string>> = {},
): FieldProps[] {
  return specs.map((f) => {
    const base = {
      name: f.key,
      label: f.label,
      defaultValue: asText(values[f.key]),
      error: errors[f.key],
      ...(f.required ? { required: true } : {}),
      ...(f.help ? { help: f.help } : {}),
      ...(f.unit ? { unit: f.unit } : {}),
    };
    switch (f.type) {
      case "number":
      case "integer":
      case "duration":
        return {
          ...base,
          type: "stepper",
          step: f.step ?? (f.type === "number" ? 0.5 : 1),
        };
      case "scale":
        return {
          ...base,
          type: "scale",
          options: Array.from({ length: f.scale ?? 5 }, (_, i) => ({
            value: String(i + 1),
            label: String(i + 1),
          })),
        };
      case "choice":
        return { ...base, type: "choice", options: [...(f.choices ?? [])] };
      case "boolean":
        return {
          ...base,
          type: "choice",
          options: [
            { value: "yes", label: WORDS.form.yes },
            { value: "no", label: WORDS.form.no },
          ],
        };
      case "time":
        return { ...base, type: "time" };
      case "date":
        return { ...base, type: "date" };
      case "recurrence":
        return { ...base, type: "recurrence" };
      default:
        return { ...base, type: "text" };
    }
  });
}

const fmt = (n: number) => String(n).replace(".", ",");

/** The posted form read back: typed values, or the error each field shows. */
export function readForm(
  specs: readonly FormFieldSpec[],
  get: (name: string) => string | null,
): { values: Record<string, FormValue>; errors: Record<string, string> } {
  const values: Record<string, FormValue> = {};
  const errors: Record<string, string> = {};
  for (const f of specs) {
    const raw = (get(f.key) ?? "").trim();
    if (raw === "") {
      if (f.required) errors[f.key] = WORDS.form.required;
      values[f.key] = null;
      continue;
    }
    if (
      f.type === "number" ||
      f.type === "integer" ||
      f.type === "duration" ||
      f.type === "scale"
    ) {
      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n)) errors[f.key] = WORDS.form.number;
      else if (f.type !== "number" && !Number.isInteger(n))
        errors[f.key] = WORDS.form.whole;
      else {
        const min = f.type === "scale" ? 1 : f.min;
        const max = f.type === "scale" ? (f.scale ?? 5) : f.max;
        if ((min !== undefined && n < min) || (max !== undefined && n > max))
          errors[f.key] = WORDS.form.between(
            fmt(min ?? 0),
            fmt(max ?? n) + (f.unit ? " " + f.unit : ""),
          );
      }
      values[f.key] = n;
    } else if (f.type === "boolean") values[f.key] = raw === "yes";
    else if (f.type === "choice") {
      if (!(f.choices ?? []).some((c) => c.value === raw))
        errors[f.key] = WORDS.form.required;
      values[f.key] = raw;
    } else if (f.type === "date") {
      // A day from its native picker (PAT-61): ISO, never typed by hand.
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(Date.parse(raw)))
        errors[f.key] = WORDS.form.date;
      values[f.key] = raw;
    } else if (f.type === "recurrence") {
      // «Ogni quanto» (PAT-61): the JSON its piece posts, checked and written one way.
      const r = readRecurrence(raw);
      if (!r) errors[f.key] = WORDS.recurrence.invalid;
      values[f.key] = r ? JSON.stringify(r) : raw;
    } else values[f.key] = raw;
  }
  return { values, errors };
}
