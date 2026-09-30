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

/** An ingredient's (or a snapshot line's) quality attributes. */
export type Quality = {
  nova: Nova | null;
  origin: Origin | null;
  fiberTypes: FiberType[];
};

export const NO_QUALITY: Quality = { nova: null, origin: null, fiberTypes: [] };

/** From a row, dropping anything outside the closed lists (never trusted blindly). */
export function qualityOf(row: {
  nova: number | null;
  origin: string | null;
  fiberTypes: readonly string[];
}): Quality {
  return {
    nova: (NOVA_LEVELS as readonly number[]).includes(row.nova ?? 0)
      ? (row.nova as Nova)
      : null,
    origin: row.origin && isOrigin(row.origin) ? row.origin : null,
    fiberTypes: row.fiberTypes.filter(isFiberType),
  };
}

/**
 * Icon keys a free tag can use (ADR-0012); ui/TagIcon maps each to an icon.
 * Validated on save, unknown keys fall back to "tag" when shown.
 */
export const TAG_ICONS = [
  "tag",
  "store",
  "shopping-cart",
  "leaf",
  "sprout",
  "star",
  "heart",
  "flame",
  "snowflake",
  "package",
  "wheat-off",
  "milk-off",
] as const;
export type TagIcon = (typeof TAG_ICONS)[number];
