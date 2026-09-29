/**
 * app/_server/forms.ts — turns a submitted HTML form (FormData) into a plain
 * object that core's validation understands (core/nutrition/validation.ts).
 *
 * Kept tiny and dumb on purpose: all RULES live in core. This file only
 * changes the container.
 */
import "server-only";

/** { fieldName: value } for every text field. Files are ignored. */
export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/**
 * Parses a JSON-encoded field (the meal editor sends its lines as JSON in a
 * hidden input). Invalid JSON becomes `undefined`, which validation then
 * reports as "required" — never an unhandled exception.
 */
export function parseJsonField(raw: string | undefined): unknown {
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
