/**
 * core/import/fitforge-training.ts — the training part of a FitForge export
 * (workoutSessions, workoutPresets, bodyMetrics) as import plans (ADR-0005).
 * PURE. Nutrition from the same file is ./fitforge.ts.
 *
 * FitForge had no session names: a session is labelled with the preset
 * whose exercises it shares most ("Legs", "Push"…), a treadmill-only one
 * "Tapis roulant". Treadmill exercises become cardio sets (duration, speed,
 * incline); strength sets keep reps, kg and rest. Start times were not
 * recorded (FitForge stored noon), so the time is left unknown.
 */
import { z } from "zod";
import {
  plainSet,
  type PlannedMeasurement,
  type PlannedRoutine,
  type PlannedSession,
} from "./training-plan";

const set = z.object({
  reps: z.number().nullable(),
  weightKg: z.number().nullable(),
  durationS: z.number().nullable().optional(),
  restAfterS: z.number().nullable().optional(),
});
const exercise = z.object({
  name: z.string(),
  type: z.string(),
  durationMin: z.number().nullable().optional(),
  speedKmh: z.number().nullable().optional(),
  inclinePercent: z.number().nullable().optional(),
  sets: z.array(set),
});
const file = z.object({
  workoutSessions: z
    .array(
      z.object({
        date: z.string(),
        durationMin: z.number().nullable(),
        notes: z.string().nullable(),
        exercises: z.array(exercise),
      }),
    )
    .default([]),
  workoutPresets: z
    .array(
      z.object({
        name: z.string(),
        exercises: z.array(
          z.object({
            name: z.string(),
            defaultSets: z.number(),
            defaultReps: z.number().nullable(),
            defaultWeightKg: z.number().nullable(),
            defaultRestAfterS: z.number().nullable(),
          }),
        ),
      }),
    )
    .default([]),
  bodyMetrics: z
    .array(
      z.object({
        date: z.string(),
        weightKg: z.number().nullable(),
        bodyFatPct: z.number().nullable(),
        waistCm: z.number().nullable(),
        notes: z.string().nullable(),
        formulaUsed: z.string().nullable().optional(),
      }),
    )
    .default([]),
});

export type FitforgeTraining = {
  sessions: PlannedSession[];
  routines: PlannedRoutine[];
  measurements: PlannedMeasurement[];
};

const num = (v: number | null | undefined) =>
  v === null || v === undefined ? null : String(v);

export function parseFitforgeTraining(raw: unknown): FitforgeTraining {
  const d = file.parse(raw);
  const presets = d.workoutPresets.map((p) => ({
    name: p.name,
    names: new Set(p.exercises.map((e) => e.name.toLowerCase())),
  }));
  const labelOf = (names: string[]) => {
    if (names.every((n) => /treadmill/i.test(n))) return "Tapis roulant";
    let best = { name: "Allenamento", shared: 0 };
    for (const p of presets) {
      const shared = names.filter((n) => p.names.has(n.toLowerCase())).length;
      if (shared > best.shared) best = { name: p.name, shared };
    }
    return best.name;
  };
  return {
    sessions: d.workoutSessions.map((s) => ({
      label: labelOf(s.exercises.map((e) => e.name)),
      day: s.date.slice(0, 10),
      time: null,
      durationMin: s.durationMin,
      notes: s.notes ?? "",
      exercises: s.exercises.map((e) =>
        e.type === "strength"
          ? {
              name: e.name,
              notes: "",
              restS: e.sets[0]?.restAfterS ?? null,
              sets: e.sets
                .filter((x) => x.reps !== null)
                .map((x) => plainSet({ reps: x.reps, loadKg: num(x.weightKg) })),
            }
          : {
              // Treadmill and the like: one cardio set with its settings.
              name: e.name,
              notes: "",
              restS: null,
              sets: [
                plainSet({
                  durationS: Math.round((e.durationMin ?? 0) * 60) || null,
                  speedKmh: num(e.speedKmh),
                  inclinePct: num(e.inclinePercent),
                }),
              ],
            },
      ),
    })),
    routines: d.workoutPresets.map((p) => ({
      name: p.name,
      items: p.exercises.map((e) => ({
        name: e.name,
        sets: e.defaultSets,
        reps: e.defaultReps,
        loadKg: num(e.defaultWeightKg),
        restS: e.defaultRestAfterS,
      })),
    })),
    measurements: d.bodyMetrics
      .filter((m) => m.weightKg !== null)
      .map((m) => ({
        day: m.date.slice(0, 10),
        weightKg: String(m.weightKg),
        bodyFatPct: num(m.bodyFatPct),
        waistCm: num(m.waistCm),
        notes: [m.notes, m.formulaUsed ? `% grasso: formula ${m.formulaUsed}` : null]
          .filter(Boolean)
          .join(" · "),
      })),
  };
}
