/**
 * core/training/guides.ts — how each kind of exercise is usually trained
 * (ADR-0028): one guide per movement pattern, so every exercise with a
 * pattern has one (its pattern, else the one its name suggests). The words
 * — setup cues and common mistakes — are in i18n (`guides`); here are the
 * numbers. Pure; tested in guides.test.ts.
 *
 * Ranges follow the usual references for hypertrophy and general strength
 * (ACSM 2009 progression stand; Schoenfeld et al. 2016–2021 on volume, rep
 * ranges and rest): compound lifts 6–10 reps with 2–3 min rest, isolation
 * 10–15 with 60–90 s, 2–4 working sets. Guidance, not prescription.
 */
import { suggestAnatomy, type MovementPattern } from "./anatomy";

export type GuideKey = Exclude<MovementPattern, "other">;

export type Guide = {
  /** compound: several joints, heavy · isolation: one joint · core · cardio. */
  role: "compound" | "isolation" | "core" | "cardio";
  /** Working reps (seconds for a plank, minutes for cardio). */
  reps: [number, number];
  sets: [number, number];
  restS: [number, number];
  /** Ramp-up sets before the working ones (the first compound of a group). */
  warmup: boolean;
  /** What goes up when the top of the range is reached. */
  progression: "load" | "reps" | "time";
};

const compound = (reps: [number, number] = [6, 10]): Guide => ({
  role: "compound",
  reps,
  sets: [3, 4],
  restS: [120, 180],
  warmup: true,
  progression: "load",
});
const isolation = (reps: [number, number] = [10, 15]): Guide => ({
  role: "isolation",
  reps,
  sets: [2, 4],
  restS: [60, 90],
  warmup: false,
  progression: "load",
});

export const GUIDES: Record<GuideKey, Guide> = {
  horizontal_press: compound(),
  vertical_press: compound([6, 10]),
  horizontal_pull: compound([8, 12]),
  vertical_pull: compound([8, 12]),
  squat: compound([5, 8]),
  leg_press: compound([8, 12]),
  lunge: { ...compound([8, 12]), warmup: false },
  hinge: compound([5, 8]),
  fly: isolation([10, 15]),
  rear_fly: isolation([12, 20]),
  lateral_raise: isolation([12, 20]),
  curl: isolation([8, 12]),
  triceps_extension: isolation([10, 15]),
  leg_curl: isolation([8, 12]),
  leg_extension: isolation([10, 15]),
  calf_raise: isolation([10, 15]),
  crunch: { ...isolation([10, 20]), role: "core" },
  leg_raise: { ...isolation([8, 15]), role: "core", progression: "reps" },
  plank: {
    role: "core",
    reps: [30, 60],
    sets: [2, 3],
    restS: [45, 60],
    warmup: false,
    progression: "time",
  },
  run: {
    role: "cardio",
    reps: [20, 45],
    sets: [1, 1],
    restS: [0, 0],
    warmup: false,
    progression: "time",
  },
  bike: {
    role: "cardio",
    reps: [20, 45],
    sets: [1, 1],
    restS: [0, 0],
    warmup: false,
    progression: "time",
  },
};

/** The guide of an exercise: its pattern's, else the one its name suggests. */
export function guideKeyOf(e: { pattern: string | null; name: string }): GuideKey | null {
  const p = e.pattern && e.pattern !== "other" && e.pattern in GUIDES ? e.pattern : null;
  if (p) return p as GuideKey;
  const s = suggestAnatomy(e.name).pattern;
  return s && s !== "other" ? s : null;
}
