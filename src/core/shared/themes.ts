/**
 * core/shared/themes.ts — the themes a user can choose (ADR-0010).
 *
 * A theme is a set of design tokens (src/design/themes/<id>.css) plus,
 * optionally, its own version of some components. The id is stored per user
 * (user_settings.theme), so it follows the user across devices; light/dark
 * and layout are per device (./display.ts).
 *
 * In core, like ./locales.ts, because core validates the settings form and
 * may not import design/ or i18n/; app/_server/i18n.ts fails to compile if
 * a theme here has no name in a dictionary.
 */
export const THEMES = ["label", "orto", "cruscotto"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "label";

export function isTheme(s: string): s is Theme {
  return (THEMES as readonly string[]).includes(s);
}
