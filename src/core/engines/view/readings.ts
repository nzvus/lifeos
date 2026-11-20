/**
 * The visualization engine (MOD-56), first layer: how it reads anything the registry holds
 * (MOD-57, bars-study §18.2). Every field type has a **reading**; every reading the aggregates it
 * allows over a frame (the metrics engine's own names: the maths stays there) and the **family**
 * that draws it (§18.3). A new tracker is read with no new code. Pure.
 */
import type { Aggregate } from "../metrics";
import {
  classOf,
  type Field,
  type Kind,
  type KindClass,
  type Question,
} from "../../kinds";

export const READINGS = [
  "amount",
  "time",
  "rating",
  "done",
  "category",
  "presence",
  "composition",
  "score",
] as const;
export type Reading = (typeof READINGS)[number];

/** The family that draws a reading (bars-study §18.3); a kit piece per family. */
export type ViewFamily = "bar" | "span" | "mark" | "cells" | "shares" | "split" | "chip";

type Rule = { aggregates: Aggregate["type"][]; family: ViewFamily };
export const RULES: Record<Reading, Rule> = {
  amount: { aggregates: ["sum", "mean", "last", "max"], family: "bar" },
  time: { aggregates: ["sum", "mean", "regularity"], family: "span" },
  rating: { aggregates: ["mean", "min", "max"], family: "mark" },
  done: { aggregates: ["count", "share"], family: "cells" },
  category: { aggregates: ["count", "share"], family: "shares" },
  presence: { aggregates: ["count"], family: "cells" },
  composition: { aggregates: ["sum"], family: "split" },
  score: { aggregates: ["mean", "min"], family: "chip" },
};

/**
 * A field's reading, or null for what is not a measure: a ref names an object (it groups, it is
 * a dimension), a time or a date places the voce, a recurrence plans it (MOD-57).
 */
export function readingOf(f: Pick<Field, "type">): Reading | null {
  switch (f.type) {
    case "number":
    case "integer":
      return "amount";
    case "duration":
      return "time";
    case "scale":
      return "rating";
    case "boolean":
      return "done";
    case "choice":
      return "category";
    case "text":
      return "presence";
    default:
      return null;
  }
}

/** A reading's question when the field does not say one (MOD-58). */
export const DEFAULT_QUESTION: Record<Reading, Question> = {
  amount: "reach",
  time: "rhythm",
  rating: "name",
  done: "yes/no",
  category: "name",
  presence: "name",
  composition: "composition",
  score: "verdict",
};

/** The instrument a question takes (VIS-102); with many members any of them becomes cells. */
export const INSTRUMENT_OF = {
  reach: "bar",
  prediction: "fan",
  trend: "line",
  "yes/no": "cells",
  rhythm: "rail",
  stock: "tank",
  comparison: "ghost",
  composition: "parts",
  source: "rows",
  spread: "band",
  verdict: "skyline",
  name: "word",
} as const satisfies Record<Question, string>;
export type Instrument = (typeof INSTRUMENT_OF)[Question] | "cells";

/** The question a field answers: its own, else its reading's default (MOD-58). */
export function questionOf(f: Pick<Field, "type" | "question">): Question | null {
  if (f.question) return f.question;
  const r = readingOf(f);
  return r ? DEFAULT_QUESTION[r] : null;
}

export type Measure = {
  /** The field it reads; none for the voce's own span or its lines. */
  field?: string;
  reading: Reading;
  aggregates: Aggregate["type"][];
  family: ViewFamily;
  /** What it answers, and so the instrument that draws it (MOD-58, VIS-102). */
  question: Question;
  instrument: Instrument;
};

/**
 * What the engine can draw of a kind: the span of an interval (time), its fields' measures, its
 * lines (a composition), and the voce itself (presence: how many). Internal fields are the
 * type's own and are left out.
 */
export function measuresOf(k: Kind): { class: KindClass; measures: Measure[] } {
  const measures: Measure[] = [];
  const add = (reading: Reading, field?: Field) => {
    const question = (field && questionOf(field)) || DEFAULT_QUESTION[reading];
    measures.push({
      ...(field ? { field: field.key } : {}),
      reading,
      ...RULES[reading],
      question,
      instrument: INSTRUMENT_OF[question],
    });
  };
  if (k.shape === "interval") add("time");
  for (const f of k.fields) {
    if (f.internal) continue;
    const r = readingOf(f);
    if (r) add(r, f);
  }
  if (k.composite) add("composition");
  // Every voce can be counted: how many in the frame (a journal has only this).
  add("presence");
  return { class: classOf(k), measures };
}
