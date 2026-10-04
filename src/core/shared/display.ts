/**
 * core/shared/display.ts — the per-device display settings (ADR-0010):
 * light / dark / system, the layout auto / desktop / phone, and the density
 * compact / comfortable (ADR-0038; compact by default: "compactness").
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

export const DENSITIES = ["compact", "comfortable"] as const;
export type Density = (typeof DENSITIES)[number];

export type Display = { mode: ColorMode; layout: Layout; density: Density };
export const DEFAULT_DISPLAY: Display = {
  mode: "system",
  layout: "auto",
  density: "compact",
};

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

export function parseDensity(value: string | undefined): Density {
  return (DENSITIES as readonly string[]).includes(value ?? "")
    ? (value as Density)
    : DEFAULT_DISPLAY.density;
}
