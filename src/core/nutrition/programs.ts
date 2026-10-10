/**
 * core/nutrition/programs.ts — a day type's program (ADR-0044): what the
 * editor sends, and the starter programs. Pure.
 *
 * Times travel as "HH:MM" and are stored as minutes after midnight; shares
 * travel as whole percent and are stored as 0–1. Shares are soft hints for
 * the day's slots; together they may not exceed 100 %.
 */
import { z } from "zod";
import { jsonField, time } from "../shared/validation";
import { MOMENTS, minutesOf, type Moment } from "./moments";

export type ProgramSlot = {
  kind: Moment;
  /** Minutes after midnight. */
  at: number;
  /** 0–1, or null for no hint. */
  kcalShare: number | null;
  proteinShare: number | null;
};

export type DayProgram = {
  trainingAt: number | null;
  shiftKcal: number;
  /** In time order. */
  slots: ProgramSlot[];
};

const percent = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v, ctx) => {
    const raw = String(v ?? "").trim();
    if (raw === "") return null;
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      ctx.addIssue({ code: "custom", message: "invalid_number" });
      return z.NEVER;
    }
    return Math.round(n) / 100;
  });

const slotInput = z.object({
  kind: z.enum(MOMENTS, "invalid_choice"),
  at: z
    .string()
    .refine((v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v), "invalid_time")
    .transform(minutesOf),
  kcalShare: percent,
  proteinShare: percent,
});

const total = (slots: { kcalShare: number | null }[], key: "kcalShare") =>
  slots.reduce((a, s) => a + (s[key] ?? 0), 0);

export const programInput = z
  .object({
    trainingAt: time.transform((v) => (v === null ? null : minutesOf(v))),
    shiftKcal: z.coerce
      .number("invalid_number")
      .int("invalid_number")
      .min(-1000, "not_positive")
      .max(1000, "too_large"),
    slots: jsonField(z.array(slotInput).max(12, "too_large")).transform((s) => s ?? []),
  })
  .superRefine((p, ctx) => {
    if (total(p.slots, "kcalShare") > 1.0001)
      ctx.addIssue({ code: "custom", path: ["slots"], message: "too_large" });
    if (p.slots.reduce((a, s) => a + (s.proteinShare ?? 0), 0) > 1.0001)
      ctx.addIssue({ code: "custom", path: ["slots"], message: "too_large" });
  })
  .transform((p): DayProgram => ({
    ...p,
    slots: [...p.slots].sort((a, b) => a.at - b.at),
  }));

const h = (hh: number, mm = 0) => hh * 60 + mm;
const slot = (kind: Moment, at: number, kcal: number | null, protein: number | null) => ({
  kind,
  at,
  kcalShare: kcal,
  proteinShare: protein,
});

/**
 * Starter programs (ADR-0044). Shares follow the plan's guidance: protein
 * spread over 3–5 meals of ≥ 0.25–0.4 g/kg, carbs and protein around
 * training, a light pre-sleep protein.
 */
export const STARTERS = {
  rest: {
    trainingAt: null,
    shiftKcal: 0,
    slots: [
      slot("breakfast", h(8), 0.25, 0.25),
      slot("lunch", h(13), 0.35, 0.3),
      slot("snack", h(16, 30), 0.1, 0.1),
      slot("dinner", h(20), 0.3, 0.35),
    ],
  },
  gymMorning: {
    trainingAt: h(7),
    shiftKcal: 0,
    slots: [
      slot("pre_workout", h(6, 15), 0.1, 0.1),
      slot("post_workout", h(8, 30), 0.25, 0.3),
      slot("lunch", h(13), 0.3, 0.25),
      slot("dinner", h(20), 0.35, 0.35),
    ],
  },
  gymEvening: {
    trainingAt: h(18),
    shiftKcal: 0,
    slots: [
      slot("breakfast", h(8), 0.2, 0.2),
      slot("lunch", h(13), 0.3, 0.25),
      slot("pre_workout", h(16, 30), 0.1, 0.05),
      slot("post_workout", h(19, 45), 0.3, 0.35),
      slot("pre_sleep", h(22, 30), 0.1, 0.15),
    ],
  },
  longCardio: {
    trainingAt: h(9),
    shiftKcal: 0,
    slots: [
      slot("pre_workout", h(7, 30), 0.15, 0.1),
      slot("post_workout", h(11, 30), 0.3, 0.3),
      slot("snack", h(16), 0.15, 0.15),
      slot("dinner", h(20), 0.4, 0.45),
    ],
  },
} satisfies Record<string, DayProgram>;
export type Starter = keyof typeof STARTERS;
