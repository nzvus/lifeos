/**
 * core/kinds/kind.ts — what a kind is (concepts §2). Built-in kinds are
 * declared in code (`builtins.ts`); the user's own kinds are rows of
 * `kinds` whose `definition` is checked by this same type, so a tracker the
 * person makes is shown, entered and charted by the same code as a built-in.
 *
 * A kind names its **family** (kit.md §1: hue, drawing, silhouette) and,
 * when it has them, its **subcategories**: either fixed (a weigh-in is
 * "weight") or read from a field (a meal's role).
 */
import { z } from "zod";

export const FAMILIES = [
  "food",
  "train",
  "sleep",
  "body",
  "drink",
  "money",
  "mind",
  "habit",
] as const;
export type Family = (typeof FAMILIES)[number];

/**
 * What a thing *is* (MOD-57, bars-study §18.1; his «yc», 20 Nov): the class the visualization
 * engine (MOD-56) reads to draw it, whatever its type. A tracker takes its class from its family.
 */
export const CLASSES = [
  "intake",
  "activity",
  "state",
  "measurement",
  "exchange",
  "note",
  "context",
] as const;
export type KindClass = (typeof CLASSES)[number];

/**
 * The question a field answers (MOD-58, VIS-102; his «yc» q10, 20 Nov): the engine picks the
 * instrument from it. A field says it only when its reading's default is not what he reads.
 */
export const QUESTIONS = [
  "reach",
  "prediction",
  "trend",
  "yes/no",
  "rhythm",
  "stock",
  "comparison",
  "composition",
  "source",
  "spread",
  "verdict",
  "name",
] as const;
export type Question = (typeof QUESTIONS)[number];

/** A tracker's class when it does not say one: from its family (MOD-57). */
export const FAMILY_CLASS: Record<Family, KindClass> = {
  food: "intake",
  drink: "intake",
  train: "activity",
  habit: "activity",
  sleep: "state",
  body: "measurement",
  mind: "measurement",
  money: "exchange",
};

export const DOMAINS = [
  "food",
  "training",
  "body",
  "sleep",
  "mind",
  "work",
  "money",
  "home",
] as const;

export const FIELD_TYPES = [
  "number",
  "integer",
  "duration",
  "boolean",
  "choice",
  "scale",
  "text",
  "ref",
  "time",
  /** A day, ISO «YYYY-MM-DD», from its native picker (PAT-61). */
  "date",
  /** «Ogni quanto» (PL-20, PAT-61): the engine's `Recurrence` as JSON text. */
  "recurrence",
] as const;

const key = z.string().regex(/^[a-z][a-z0-9_]*$/, "lower_snake_case");
const fieldKey = z.string().regex(/^[a-z][a-zA-Z0-9]*$/, "camelCase");

export const fieldSchema = z
  .object({
    key: fieldKey,
    /** The person's own word for it (a user kind's field); built-ins have theirs in features. */
    label: z.string().min(1).max(40).optional(),
    type: z.enum(FIELD_TYPES),
    unit: z.string().optional(),
    /** For `scale`: the top of the scale (1–5 or 1–10). */
    scale: z.union([z.literal(5), z.literal(10)]).optional(),
    /** For `choice`: the allowed values. */
    choices: z.array(z.string()).min(2).optional(),
    /** For `ref`: the catalog the item comes from. */
    catalog: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    required: z.boolean().default(false),
    /** Stored, never shown as a value row: its type's own section edits it (a blocco's `kind`). */
    internal: z.boolean().optional(),
    /** The question it answers, when not its reading's default (MOD-58). */
    question: z.enum(QUESTIONS).optional(),
  })
  .refine((f) => f.type !== "scale" || f.scale !== undefined, "a scale needs its top")
  .refine((f) => f.type !== "choice" || f.choices !== undefined, "a choice needs choices")
  .refine((f) => f.type !== "ref" || f.catalog !== undefined, "a ref needs its catalog")
  .refine(
    (f) => f.min === undefined || f.max === undefined || f.min <= f.max,
    "min above max",
  );

/** A relation the kind declares (concepts §8); E1's `relate` computes it. */
const gapSchema = z.object({
  to: key,
  bands: z.array(z.object({ tag: z.string(), min: z.number(), max: z.number() })).min(1),
});

export const kindSchema = z
  .object({
    key,
    /** The person's own name for it (a user kind: the row's `name`). */
    name: z.string().min(1).max(40).optional(),
    family: z.enum(FAMILIES),
    /** What it is (MOD-57); a built-in says it, a tracker takes its family's. */
    class: z.enum(CLASSES).optional(),
    domain: z.enum(DOMAINS),
    shape: z.enum(["instant", "interval"]),
    entry: z.enum(["quick", "form", "timer", "specialised"]),
    fields: z.array(fieldSchema),
    /** Lines of a catalog (a meal's foods), or children of another kind (a session's exercises). */
    composite: z
      .union([z.object({ lines: z.string() }), z.object({ children: key })])
      .optional(),
    /** It only lives under a parent entry (a session's exercise): never a row of its own on the day. */
    child: z.boolean().default(false),
    /** Fixed, or the field whose value names it. */
    subcategory: z.union([z.string(), z.object({ field: fieldKey })]).optional(),
    /** Where an interval sits on the timeline: at its start, or at its end (sleep: the wake). */
    anchor: z.enum(["start", "end"]).default("start"),
    relations: z.array(gapSchema).default([]),
  })
  .refine(
    (k) => new Set(k.fields.map((f) => f.key)).size === k.fields.length,
    "two fields with the same key",
  )
  .refine((k) => {
    const s = k.subcategory;
    return typeof s !== "object" || k.fields.some((f) => f.key === s.field);
  }, "the subcategory field is not a field of the kind");

export type KindInput = z.input<typeof kindSchema>;
export type Kind = z.output<typeof kindSchema>;
export type Field = z.output<typeof fieldSchema>;

/** A kind's class: its own, else its family's (MOD-57). */
export const classOf = (k: Pick<Kind, "class" | "family">): KindClass =>
  k.class ?? FAMILY_CLASS[k.family];
