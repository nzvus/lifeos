/**
 * core/entries/check.ts — an entry typed by hand, checked against its kind
 * (concepts §2: the same rules for a built-in and a user's own kind). Pure:
 * the form's strings in, the rows to write or one error code per field out.
 *
 * - Numbers accept a decimal comma ("75,6") and are kept exact (strings).
 * - A number, integer, duration or scale goes to `num`; a choice, text or
 *   time to `text`; a boolean to `bool`. A `ref` needs a catalog picker:
 *   not entered here yet.
 * - Times are minutes of the logical day (`DayMin`); an interval needs its
 *   start, and its end after it. `day` stays the day the person chose.
 */
import type { DayClock, IsoDate } from "../engines/time";
import { instantAt } from "../engines/time";
import type { Field, Kind } from "../kinds";

export type EntryInput = {
  day: IsoDate;
  status: "done" | "planned";
  /** Minute of the logical day; null when untimed. */
  startMin: number | null;
  endMin: number | null;
  /** Field key → the form's raw value ("" = not given). */
  values: Record<string, string>;
  note: string;
};

export type FieldError =
  | "required"
  | "number"
  | "integer"
  | "min"
  | "max"
  | "choice"
  | "too_long"
  | "unsupported";
export type EntryErrors = Partial<
  Record<string, FieldError | "start_required" | "end_before_start">
>;

export type EntryValue = {
  field: string;
  num?: string;
  text?: string;
  bool?: boolean;
};
export type CheckedEntry = {
  kind: string;
  day: IsoDate;
  status: EntryInput["status"];
  startAt: Date | null;
  endAt: Date | null;
  note: string;
  values: EntryValue[];
};

const TEXT_MAX = 500;
export const NOTE_MAX = 2000;
const NUMBER = /^-?\d+(\.\d+)?$/;

/** Kinds this generic sheet can enter: no lines, no children, no catalog item to pick. */
export function enterable(kind: Kind): boolean {
  return (
    kind.entry !== "specialised" &&
    !kind.child &&
    kind.composite === undefined &&
    !NEEDS_ITEM.has(kind.key)
  );
}
/** A purchase or a stock count is of a pantry item: entered from Dispensa. */
const NEEDS_ITEM = new Set(["purchase", "stock_count"]);

function checkField(
  f: Field,
  raw: string,
): { error: FieldError } | { value: EntryValue } | null {
  const v = raw.trim();
  if (v === "") return f.required ? { error: "required" } : null;
  switch (f.type) {
    case "number":
    case "integer":
    case "duration":
    case "scale": {
      const n = v.replace(",", ".");
      if (!NUMBER.test(n)) return { error: "number" };
      const x = Number(n);
      if ((f.type === "integer" || f.type === "scale") && !Number.isInteger(x))
        return { error: "integer" };
      const min = f.type === "scale" ? 1 : f.min;
      const max = f.type === "scale" ? f.scale : f.max;
      if (min !== undefined && x < min) return { error: "min" };
      if (max !== undefined && x > max) return { error: "max" };
      return { value: { field: f.key, num: n } };
    }
    case "boolean":
      if (v !== "true" && v !== "false") return { error: "choice" };
      return { value: { field: f.key, bool: v === "true" } };
    case "choice":
      if (!f.choices!.includes(v)) return { error: "choice" };
      return { value: { field: f.key, text: v } };
    case "text":
    case "time":
      if (v.length > TEXT_MAX) return { error: "too_long" };
      return { value: { field: f.key, text: v } };
    case "ref":
      return { error: "unsupported" };
  }
}

export function checkEntry(
  kind: Kind,
  input: EntryInput,
  clock: DayClock,
): { ok: true; entry: CheckedEntry } | { ok: false; errors: EntryErrors } {
  const errors: EntryErrors = {};
  const values: EntryValue[] = [];
  for (const f of kind.fields) {
    const r = checkField(f, input.values[f.key] ?? "");
    if (r === null) continue;
    if ("error" in r) errors[f.key] = r.error;
    else values.push(r.value);
  }
  const interval = kind.shape === "interval";
  if (interval && input.startMin === null) errors["start"] = "start_required";
  if (
    interval &&
    input.startMin !== null &&
    input.endMin !== null &&
    input.endMin <= input.startMin
  )
    errors["end"] = "end_before_start";
  if (input.note.length > NOTE_MAX) errors["note"] = "too_long";
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const at = (m: number | null) => (m === null ? null : instantAt(input.day, m, clock));
  return {
    ok: true,
    entry: {
      kind: kind.key,
      day: input.day,
      status: input.status,
      startAt: at(input.startMin),
      endAt: interval ? at(input.endMin) : null,
      note: input.note.trim(),
      values,
    },
  };
}
