/** The kit's gallery exists only while developing (dossiers/visual.md §4): never in production. */
export const galleryAllowed = (env: string | undefined) => env !== "production";
