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
 *   midnight: it ends the morning after.
 * - A kind anchored at its end (sleep) is placed by its end (dossiers/sleep.md
 *   §5): on today's page the latest such time not after now, so a wake at
 *   03:00 logged at 09:00 is this morning's, never tomorrow night's; on a past
 *   day's page the page's own date. The start is the latest time before it.
 */
import { F, type BoxEntry, type FieldProps } from "@lifeos/kit";
import type { DayItem } from "@/core/day";
import type { EntryErrors, EntryInput } from "@/core/entries";
import { addDays, localParts, type IsoDate } from "@/core/engines/time";
import type { Field, Kind } from "@/core/kinds";
import { CHOICES, FIELDS, keyWords, NAMES } from "./words";

/** Form names: a kind's field is "v.<key>", so it never meets the sheet's own. */
export const VALUE = "v.";

const STEP: Record<string, number> = {
  ml: 250,
  steps: 1000,
  weightKg: 0.1,
  bodyFatPct: 0.5,
  walkingMin: 5,
  onFeetH: 0.5,
};
// Steps' «level» is no longer asked (movement.md §4, activity.md §4): old values stay.
const HIDDEN = new Set(["sleep.bedAt", "sleep.wakeAt", "steps.level"]);
const SPAN: Record<string, [string, string]> = { sleep: ["A letto", "Sveglia"] };
/** Fields asked under «Altre misure», closed: a weighing is its weight first. */
const MORE: Record<string, ReadonlySet<string>> = {
  weigh_in: new Set(["bodyFatPct", "waistCm", "hipCm", "neckCm", "abdomenCm"]),
};

function field(f: Field): FieldProps {
  const base = {
    name: VALUE + f.key,
    label: FIELDS[f.key] ?? f.label ?? keyWords(f.key),
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
  /** A span placed by its end (sleep): the sheet says which night it is. */
  byEnd: boolean;
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
    title: NAMES[kind.key] ?? kind.name ?? keyWords(kind.key),
    fam: kind.family,
    times: span
      ? { start: SPAN[kind.key]?.[0] ?? "Inizio", end: SPAN[kind.key]?.[1] ?? "Fine" }
      : { start: "Ora", end: null },
    byEnd: span && kind.anchor === "end",
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
  /** The minute of `day` now (dayMinute), when it is today's page. */
  nowMin: number | null = null,
): EntryInput {
  if (kind.anchor === "end" && kind.shape === "interval")
    return { ...readRest(day, form), ...placeByEnd(form, boundaryMin, nowMin) };
  const startMin = clockToDayMin(form["start"] ?? "", boundaryMin);
  let endMin =
    kind.shape === "interval" ? clockToDayMin(form["end"] ?? "", boundaryMin) : null;
  if (startMin !== null && endMin !== null && endMin < startMin) endMin += 1440;
  return { ...readRest(day, form), startMin, endMin };
}

/** A span placed by its end, as minutes of the page's day (start before end, under 24 h). */
export function placeByEnd(
  form: Record<string, string>,
  boundaryMin: number,
  nowMin: number | null,
): { startMin: number | null; endMin: number | null } {
  const end = clockToDayMin(form["end"] ?? "", 0);
  const start = clockToDayMin(form["start"] ?? "", 0);
  // A planned sleep is tonight's: «now» only bounds what was done.
  const now = form["status"] === "planned" ? null : nowMin;
  const endMin = end === null ? null : placeEnd(end, boundaryMin, now);
  if (start === null || endMin === null) return { startMin: start, endMin };
  return { startMin: endMin - ((((endMin - start) % 1440) + 1440) % 1440), endMin };
}

/** The words under a sleep's times: which night and how long (dossiers/sleep.md §6). */
export function nightWords(
  day: IsoDate,
  form: Record<string, string>,
  boundaryMin: number,
  nowMin: number | null,
): string | null {
  const { startMin, endMin } = placeByEnd(form, boundaryMin, nowMin);
  if (startMin === null || endMin === null || endMin <= startMin) return null;
  const on = (m: number) => addDays(day, Math.floor(m / 1440));
  const [from, to] = [on(startMin), on(endMin)];
  return (
    (from === to ? F.Day(to) : "Notte tra " + F.day(from) + " e " + F.day(to)) +
    " · " +
    F.hm(endMin - startMin)
  );
}

/** An end's minute of the day: today, the latest not after now; a past day, the day's own. */
function placeEnd(clock: number, boundaryMin: number, nowMin: number | null): number {
  const cap = nowMin !== null && nowMin < 1440 + boundaryMin ? nowMin : null;
  if (cap === null) return clock;
  const options = [
    ...(clock < boundaryMin ? [clock + 1440] : []),
    clock,
    ...(clock > boundaryMin ? [clock - 1440] : []),
  ];
  return options.find((m) => m <= cap) ?? clock - 1440;
}

function readRest(day: IsoDate, form: Record<string, string>) {
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(form))
    if (k.startsWith(VALUE)) values[k.slice(VALUE.length)] = v;
  return {
    day,
    status: form["status"] === "planned" ? ("planned" as const) : ("done" as const),
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
      title: NAMES[k.key] ?? k.name ?? keyWords(k.key),
    },
  }));
}

/** The fields this sheet writes: an edit replaces these and leaves the others. */
export function managedFields(kind: Kind): string[] {
  const f = entryForm(kind);
  return [...f.fields, ...f.more].map((x) => x.name.slice(VALUE.length));
}

/** "75.6000" → "75,6": a stored number as the person types it. */
const typed = (n: string) => {
  const [i, d = ""] = n.split(".");
  const dec = d.replace(/0+$/, "");
  return dec ? i + "," + dec : i!;
};
const clockOf = (t: Date | null, timeZone: string) => {
  if (!t) return "";
  const m = localParts(t, timeZone).minute;
  return (
    String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0")
  );
};

/** A logged entry as its sheet's starting values (the form's names). */
export function formOf(item: DayItem, timeZone: string): Record<string, string> {
  const out: Record<string, string> = {
    status: item.status,
    start: clockOf(item.start, timeZone),
    note: item.note,
  };
  if (item.kind.shape === "interval") out["end"] = clockOf(item.end, timeZone);
  for (const f of item.kind.fields) {
    const v = item.values[f.key];
    if (v === undefined) continue;
    out[VALUE + f.key] =
      typeof v === "boolean"
        ? String(v)
        : ["number", "integer", "duration", "scale"].includes(f.type)
          ? typed(v)
          : v;
  }
  return out;
}
