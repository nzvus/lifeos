/**
 * E4a — what kind of work an exercise is, from its catalog pattern (the
 * library's «Schema»), for `sessionCost`: lower-body compounds, upper-body
 * compounds, core, isolation. Cardio patterns are not lifted sets: they
 * cost a MET band over their minutes (`activityCost`), from the 2011
 * Compendium of Physical Activities (Ainsworth 2011), moderate efforts.
 */
import type { ExerciseClass } from "./training";
import type { Range } from "./everyday";

const LOWER = ["squat", "lunge", "leg_press", "incline_leg_press", "hinge", "hip_thrust"];
const UPPER = [
  "horizontal_press",
  "incline_press",
  "dip",
  "vertical_press",
  "vertical_pull",
  "horizontal_pull",
];
const CORE = ["crunch", "twist", "plank", "leg_raise"];

export const CARDIO_MET: Readonly<Record<string, Range>> = {
  run: { low: 8, high: 11 },
  treadmill: { low: 4.5, high: 9 },
  bike: { low: 5, high: 8 },
  walk: { low: 3, high: 4.3 },
  swim: { low: 6, high: 9.5 },
  rope: { low: 8.8, high: 12.3 },
  rower: { low: 4.8, high: 8.5 },
  elliptical: { low: 5, high: 7 },
};

/** Cardio of a mode the table does not name (an elliptical, a pool): a moderate band. */
export const CARDIO_MODERATE: Range = { low: 4, high: 7 };

/** The class of a lifted exercise; null for cardio (see `CARDIO_MET`). */
export function classOf(pattern: string | null | undefined): ExerciseClass | null {
  if (pattern && pattern in CARDIO_MET) return null;
  if (pattern && LOWER.includes(pattern)) return "lowerCompound";
  if (pattern && UPPER.includes(pattern)) return "upperCompound";
  if (pattern && CORE.includes(pattern)) return "core";
  return "isolation";
}
