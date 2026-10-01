/**
 * design/browser-colors.ts — the colours the BROWSER paints before any CSS
 * loads (ADR-0019): the installed app's splash screen and the phone's status
 * bar. They can't be CSS variables, so they copy the default theme's paper;
 * theme.test.ts keeps them equal to theme.css.
 */
export const BROWSER_COLORS = { light: "#f4f6f3", dark: "#111714" } as const;
