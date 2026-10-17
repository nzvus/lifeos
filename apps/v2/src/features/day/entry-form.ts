/**
 * features/day/entry-form.ts — the entry sheet (V-03) generated from a kind:
 * its fields as kit Fields, and the posted form read back as core's
 * `EntryInput`. Pure: tested without a browser.
 *
 * - A number is a stepper, a scale its buttons, a choice segmented or a
 *   drop-down (the Field decides), a yes/no a two-way choice, a text a line.
 * - A kind's secondary fields fold under «Altre misure».
 * - A `ref` waits for the catalog picker; sleep's bed/wake text fields only
 *   hold what the converter could not make a span of: neither is asked.
 * - Times are clock times ("07:30"); before the day boundary they belong to
 *   the night after. An interval whose end comes before its start crosses
 *   midnight: a kind anchored at its end (sleep) started the evening before,
 *   any other ends the morning after.
 */
import type { BoxEntry, FieldProps } from "@lifeos/kit";
import type { EntryErrors, EntryInput } from "@/core/entries";
import type { IsoDate } from "@/core/engines/time";
import type { Field, Kind } from "@/core/kinds";
import { CHOICES, FIELDS, NAMES } from "./words";

/** Form names: a kind's field is "v.<key>", so it never meets the sheet's own. */
export const VALUE = "v.";

const STEP: Record<string, number> = {
  ml: 250,
  steps: 1000,
  weightKg: 0.1,
  bodyFatPct: 0.5,
  walkingMin: 5,
};
const HIDDEN = new Set(["sleep.bedAt", "sleep.wakeAt"]);
const SPAN: Record<string, [string, string]> = { sleep: ["A letto", "Sveglia"] };
/** Fields asked under «Altre misure», closed: a weighing is its weight first. */
const MORE: Record<string, ReadonlySet<string>> = {
  weigh_in: new Set(["bodyFatPct", "waistCm", "hipCm", "neckCm", "abdomenCm"]),
};

/** "walkingMin" → "Walking min": a user's own field in words until it has a label. */
const words = (key: string) => {
  const s = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return s[0]!.toUpperCase() + s.slice(1);
};

function field(f: Field): FieldProps {
  const base = {
    name: VALUE + f.key,
    label: FIELDS[f.key] ?? words(f.key),
    required: f.required,
  };
  switch (f.type) {
    case "number":
    case "integer":
    case "duration":
      return {
        ...base,
        type: "stepper",
        ...(f.unit ? { unit: f.unit } : {}),
        step: STEP[f.key] ?? 1,
      };
    case "scale":
      return {
        ...base,
        type: "scale",
        options: Array.from({ length: f.scale! }, (_, i) => ({
          value: String(i + 1),
          label: String(i + 1),
        })),
      };
    case "choice":
      return {
        ...base,
        type: "choice",
        options: f.choices!.map((c) => ({ value: c, label: CHOICES[f.key]?.[c] ?? c })),
      };
    case "boolean":
      return {
        ...base,
        type: "choice",
        options: [
          { value: "true", label: "Sì" },
          { value: "false", label: "No" },
        ],
      };
    case "time":
      return { ...base, type: "time" };
    default:
      return { ...base, type: "text", placeholder: "facoltativo" };
  }
}

export type EntryForm = {
  kind: string;
  title: string;
  fam: string;
  /** The time fields' labels: one ("Ora") or a span. */
  times: { start: string; end: string | null };
  fields: FieldProps[];
  /** The kind's secondary fields, folded. */
  more: FieldProps[];
};

export function entryForm(kind: Kind): EntryForm {
  const span = kind.shape === "interval";
  const asked = kind.fields.filter(
    (f) => f.type !== "ref" && !HIDDEN.has(kind.key + "." + f.key),
  );
  const more = MORE[kind.key] ?? new Set<string>();
  return {
    kind: kind.key,
    title: NAMES[kind.key] ?? words(kind.key),
    fam: kind.family,
    times: span
      ? { start: SPAN[kind.key]?.[0] ?? "Inizio", end: SPAN[kind.key]?.[1] ?? "Fine" }
      : { start: "Ora", end: null },
    fields: asked.filter((f) => !more.has(f.key)).map(field),
    more: asked.filter((f) => more.has(f.key)).map(field),
  };
}

const CLOCK = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "07:30" → the minute of the logical day; "" or nonsense → null. */
export function clockToDayMin(t: string, boundaryMin: number): number | null {
  const m = CLOCK.exec(t.trim());
  if (!m) return null;
  const min = Number(m[1]) * 60 + Number(m[2]);
  return min < boundaryMin ? min + 1440 : min;
}

export function readEntryForm(
  kind: Kind,
  day: IsoDate,
  form: Record<string, string>,
  boundaryMin: number,
): EntryInput {
  let startMin = clockToDayMin(form["start"] ?? "", boundaryMin);
  let endMin =
    kind.shape === "interval" ? clockToDayMin(form["end"] ?? "", boundaryMin) : null;
  if (startMin !== null && endMin !== null && endMin < startMin) {
    if (kind.anchor === "end") startMin -= 1440;
    else endMin += 1440;
  }
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(form))
    if (k.startsWith(VALUE)) values[k.slice(VALUE.length)] = v;
  return {
    day,
    status: form["status"] === "planned" ? "planned" : "done",
    startMin,
    endMin,
    values,
    note: form["note"] ?? "",
  };
}

const MESSAGE: Record<NonNullable<EntryErrors[string]>, string> = {
  required: "Serve un valore.",
  number: "Scrivi un numero, per esempio 75,6.",
  integer: "Serve un numero intero.",
  min: "È sotto il minimo.",
  max: "È sopra il massimo.",
  choice: "Scegli una delle opzioni.",
  too_long: "È troppo lungo.",
  unsupported: "Non si può ancora inserire qui.",
  start_required: "Serve l’ora di inizio.",
  end_before_start: "La fine viene prima dell’inizio.",
};

/** Core's error codes → the sheet's words, by the form's field names. */
export function errorWords(errors: EntryErrors): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, code] of Object.entries(errors))
    if (code) out[["start", "end", "note"].includes(k) ? k : VALUE + k] = MESSAGE[code];
  return out;
}

/** ⊕'s «Cosa» (V-02): the kinds this sheet enters, as row Boxes opening their sheet. */
export function kindRows(
  kinds: readonly Kind[],
  hrefOf: (key: string) => string,
): { key: string; href: string; entry: BoxEntry }[] {
  return kinds.map((k) => ({
    key: k.key,
    href: hrefOf(k.key),
    entry: {
      fam: k.family,
      ...(typeof k.subcategory === "string" ? { sub: k.subcategory } : {}),
      of: { kind: k.key },
      title: NAMES[k.key] ?? words(k.key),
    },
  }));
}
