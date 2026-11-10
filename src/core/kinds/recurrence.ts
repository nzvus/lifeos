/**
 * core/kinds/recurrence.ts — a `recurrence` field's value (PL-20, PAT-61): the engine's
 * `Recurrence` stored as JSON text, checked with one schema wherever it is written (the
 * registry's `valuesSchema`) or read (`core/plans/blocks.ts`).
 */
import { z } from "zod";
import type { Recurrence } from "../engines/time/recurrence";

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const recurrenceSchema: z.ZodType<Recurrence> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("daily") }),
  z.object({
    type: z.literal("weekdays"),
    days: z.array(z.number().int().min(1).max(7)).min(1),
  }),
  z.object({
    type: z.literal("everyN"),
    n: z.number().int().min(1).max(366),
    start: iso,
  }),
  z.object({ type: z.literal("timesPerWeek"), n: z.number().int().min(1).max(7) }),
  z.object({ type: z.literal("onDates"), dates: z.array(iso).min(1) }),
]);

/** A stored recurrence (JSON text) as the engine's, or null when it is not one. */
export function parseRecurrence(text: string | null | undefined): Recurrence | null {
  if (!text) return null;
  try {
    const r = recurrenceSchema.safeParse(JSON.parse(text));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}
