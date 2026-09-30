/**
 * core/nutrition/quality.ts — the typed quality attributes of an ingredient
 * (ADR-0012), closed lists like moments and themes: labels, descriptions and
 * icons live in i18n/ and ui/. They are copied into each log line's
 * snapshot, so a later reclassification never rewrites a past day.
 *
 *   nova         processing level, NOVA 1 (unprocessed) … 4 (ultra-processed)
 *   origin       plant, animal or mixed
 *   fiberTypes   the kinds of fibre it mainly contains (descriptive)
 */
export const NOVA_LEVELS = [1, 2, 3, 4] as const;
export type Nova = (typeof NOVA_LEVELS)[number];

export const ORIGINS = ["plant", "animal", "mixed"] as const;
export type Origin = (typeof ORIGINS)[number];

export const FIBER_TYPES = [
  "inulin_fos",
  "beta_glucan",
  "resistant_starch",
  "pectin",
  "psyllium",
  "insoluble",
  "gos",
] as const;
export type FiberType = (typeof FIBER_TYPES)[number];

export function isOrigin(s: string): s is Origin {
  return (ORIGINS as readonly string[]).includes(s);
}
export function isFiberType(s: string): s is FiberType {
  return (FIBER_TYPES as readonly string[]).includes(s);
}
