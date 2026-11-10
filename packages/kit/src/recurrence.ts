/**
 * «Ogni quanto» (PAT-61, PL-20; Q-15 (a), his «segui i tuoi consigli» 10 Nov): the value of a
 * `recurrence` field, the engine's shape (`core/engines/time/recurrence.ts`) as JSON text.
 * Pure: read back and checked, said in words, and the value a new kind starts from. The
 * server checks it again with the engine's own schema (`core/plans/blocks.ts`).
 */
import { F } from "./format";
import { WORDS } from "./words";

export type Recurrence =
  | { type: "daily" }
  | { type: "weekdays"; days: number[] }
  | { type: "everyN"; n: number; start: string }
  | { type: "timesPerWeek"; n: number }
  | { type: "onDates"; dates: string[] };

export type RecurrenceKind = Recurrence["type"];
export const RECURRENCE_KINDS: readonly RecurrenceKind[] = [
  "daily",
  "weekdays",
  "everyN",
  "timesPerWeek",
  "onDates",
];

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const whole = (x: unknown, lo: number, hi: number): x is number =>
  typeof x === "number" && Number.isInteger(x) && x >= lo && x <= hi;

/** The posted text as a recurrence, or null when it is not a complete one. */
export function readRecurrence(raw: string | null | undefined): Recurrence | null {
  let v: unknown;
  try {
    v = JSON.parse(raw ?? "");
  } catch {
    return null;
  }
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  switch (r["type"]) {
    case "daily":
      return { type: "daily" };
    case "weekdays": {
      const days = r["days"];
      if (!Array.isArray(days) || days.length === 0 || !days.every((d) => whole(d, 1, 7)))
        return null;
      return { type: "weekdays", days: [...new Set(days as number[])].sort() };
    }
    case "everyN":
      return whole(r["n"], 1, 366) &&
        typeof r["start"] === "string" &&
        ISO.test(r["start"])
        ? { type: "everyN", n: r["n"], start: r["start"] }
        : null;
    case "timesPerWeek":
      return whole(r["n"], 1, 7) ? { type: "timesPerWeek", n: r["n"] } : null;
    case "onDates": {
      const dates = r["dates"];
      if (
        !Array.isArray(dates) ||
        dates.length === 0 ||
        !dates.every((d) => typeof d === "string" && ISO.test(d))
      )
        return null;
      return { type: "onDates", dates: [...new Set(dates as string[])].sort() };
    }
    default:
      return null;
  }
}

/** «ogni giorno» · «lun, mer, ven» · «ogni 3 giorni dal 10 nov» · «3 volte a settimana» · «il 12 nov, 15 nov». */
export function recurrenceText(r: Recurrence | null): string {
  const w = WORDS.recurrence;
  if (!r) return "";
  switch (r.type) {
    case "daily":
      return w.daily;
    case "weekdays":
      return r.days.length === 7 ? w.daily : r.days.map((d) => w.days[d - 1]).join(", ");
    case "everyN":
      return w.everyText(r.n, F.date(r.start));
    case "timesPerWeek":
      return w.timesText(r.n);
    case "onDates":
      return w.onText(r.dates.map((d) => F.date(d)).join(", "));
  }
}

/** The value a kind starts from when he picks it: what he had kept, else a sensible default. */
export function startOf(
  kind: RecurrenceKind,
  prev: Recurrence,
  today: string,
): Recurrence {
  if (prev.type === kind) return prev;
  switch (kind) {
    case "daily":
      return { type: "daily" };
    case "weekdays":
      return { type: "weekdays", days: [1, 2, 3, 4, 5] };
    case "everyN":
      return { type: "everyN", n: 2, start: today };
    case "timesPerWeek":
      return { type: "timesPerWeek", n: 3 };
    case "onDates":
      return { type: "onDates", dates: [today] };
  }
}
