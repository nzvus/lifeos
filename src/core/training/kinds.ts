/**
 * core/training/kinds.ts — the closed lists of the training module
 * (ADR-0005). Labels live in i18n/.
 *
 *   strength     reps × load (machines, cables, free weights)
 *   bodyweight   reps, load optional (hanging leg raises, a weighted vest)
 *   cardio       a duration, optionally distance, speed, incline
 */
export const EXERCISE_KINDS = ["strength", "bodyweight", "cardio"] as const;
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

export const SESSION_STATUSES = ["planned", "done"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/** How hard an estimated session was (ADR-0016): a MET band each (analysis.ts). */
export const INTENSITIES = ["light", "moderate", "vigorous"] as const;
export type Intensity = (typeof INTENSITIES)[number];
