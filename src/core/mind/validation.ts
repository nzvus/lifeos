/**
 * core/mind/validation.ts — the day's check-in (ADR-0038): mood, energy and
 * stress on 1–5 (empty = not said), and a note.
 */
import { z } from "zod";
import { day } from "../shared/validation";

const scale = z
  .string()
  .optional()
  .transform((v) => (v ?? "").trim())
  .refine((v) => v === "" || /^[1-5]$/.test(v), "invalid_choice")
  .transform((v) => (v === "" ? null : Number(v)));

export const checkinInput = z.object({
  day,
  mood: scale,
  energy: scale,
  stress: scale,
  note: z.string().trim().max(4000, "too_long").optional().default(""),
});
export type CheckinInput = z.output<typeof checkinInput>;
