/**
 * core/shared/locales.ts — the languages the app supports.
 *
 * Lives in core/ (not in i18n/) because core validates the settings form and
 * core is the bottom of the dependency graph: it may not import i18n/.
 * i18n/ holds the actual dictionaries; src/app/_server/i18n.ts is where both
 * meet, and its types fail if a locale here has no dictionary there.
 */
export const LOCALES = ["it", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "it";

export function isLocale(s: string): s is Locale {
  return (LOCALES as readonly string[]).includes(s);
}
