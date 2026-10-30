/** The visual study's pages exist only while developing (dossiers/visual.md §3.1): never in production. */
export const studioAllowed = (env: string | undefined) => env !== "production";
