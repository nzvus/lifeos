/**
 * core/shared/display.ts — the per-device display settings (ADR-0010):
 * light / dark / system, and the layout auto / desktop / phone.
 *
 * They are stored in cookies, not in the database, because they describe a
 * device rather than a user. Cookies can hold anything, so every value read
 * back goes through `parse*`, which falls back to the default instead of
 * failing: a bad cookie must never break a page.
 */
export const COLOR_MODES = ["system", "light", "dark"] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

export const LAYOUTS = ["auto", "desktop", "phone"] as const;
export type Layout = (typeof LAYOUTS)[number];

export type Display = { mode: ColorMode; layout: Layout };
export const DEFAULT_DISPLAY: Display = { mode: "system", layout: "auto" };

export function parseColorMode(value: string | undefined): ColorMode {
  return (COLOR_MODES as readonly string[]).includes(value ?? "")
    ? (value as ColorMode)
    : DEFAULT_DISPLAY.mode;
}

export function parseLayout(value: string | undefined): Layout {
  return (LAYOUTS as readonly string[]).includes(value ?? "")
    ? (value as Layout)
    : DEFAULT_DISPLAY.layout;
}
