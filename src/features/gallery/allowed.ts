/**
 * The kit's gallery exists only while developing (dossiers/visual.md §4): never in production,
 * except the CI build that photographs it (PAT-94: `KIT_GALLERY=true`, set by that job only).
 */
export const galleryAllowed = (env: string | undefined, flag?: string) =>
  env !== "production" || flag === "true";
