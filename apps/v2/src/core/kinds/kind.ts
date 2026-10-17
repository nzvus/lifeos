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
] as const;

const key = z.string().regex(/^[a-z][a-z0-9_]*$/, "lower_snake_case");
const fieldKey = z.string().regex(/^[a-z][a-zA-Z0-9]*$/, "camelCase");

export const fieldSchema = z
  .object({
    key: fieldKey,
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
    family: z.enum(FAMILIES),
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
