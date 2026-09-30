/**
 * ui/targetTone.ts — the colour of a bar or ring for a nutrient, given how
 * its total relates to its target. Graded, not on/off:
 *
 *   min    (protein, fibre)       under: the nutrient's colour, fainter the
 *                                 further away · reached: herb green
 *   max    (sugars, sat. fat, salt) up to 80 %: herb · 80–100 %: herb→orange
 *                                 · over: orange→tomato, fully red at +50 %
 *   target (energy, carbs, fat)   under: nutrient colour, fainter the further
 *                                 away · ±5 %: herb · over: orange→tomato,
 *                                 fully red at +25 %
 *
 * Colours are blended by the browser with CSS color-mix() from the theme's
 * tokens (design/theme.css), so no colour value is written here and dark
 * mode works automatically. Pure function: presentation only (ui/).
 */
export type ToneInput = {
  kind: "min" | "max" | "target";
  status: "none" | "under" | "on" | "over";
  ratio: number;
  /** CSS variable of the nutrient's own colour, e.g. "--color-macro-protein". */
  base: string;
};

export type Tone = { color: string; opacity: number };

const v = (name: string) => `var(${name})`;
const mix = (a: string, b: string, bPercent: number) =>
  `color-mix(in oklch, ${v(a)} ${Math.round(100 - bPercent)}%, ${v(b)})`;
const clamp = (x: number) => Math.min(1, Math.max(0, x));

export function targetTone({ kind, status, ratio, base }: ToneInput): Tone {
  if (status === "none") return { color: v(base), opacity: 1 };
  if (kind === "min") {
    return status === "under"
      ? { color: v(base), opacity: 0.35 + 0.65 * clamp(ratio) }
      : { color: v("--color-herb"), opacity: 1 };
  }
  if (kind === "max") {
    if (ratio <= 0.8) return { color: v("--color-herb"), opacity: 1 };
    if (ratio <= 1)
      return {
        color: mix("--color-herb", "--color-warn", ((ratio - 0.8) / 0.2) * 100),
        opacity: 1,
      };
    return {
      color: mix("--color-warn", "--color-tomato", clamp((ratio - 1) / 0.5) * 100),
      opacity: 1,
    };
  }
  // kind "target"
  if (status === "under") return { color: v(base), opacity: 0.35 + 0.65 * clamp(ratio) };
  if (status === "on") return { color: v("--color-herb"), opacity: 1 };
  return {
    color: mix("--color-warn", "--color-tomato", clamp((ratio - 1.05) / 0.25) * 100),
    opacity: 1,
  };
}
