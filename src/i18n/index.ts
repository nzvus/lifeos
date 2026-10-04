/**
 * i18n/index.ts — the dictionary API: the `Messages` type, the dictionaries by
 * language, and `fill()` for placeholders.
 *
 * Usage (server side): src/app/_server/i18n.ts picks the dictionary for the
 * user's locale; pages pass slices of it (e.g. `t.ingredients`) to components.
 */
import { en } from "./messages.en";
import { it } from "./messages.it";

/** The shape of every dictionary, derived from the English reference. */
export type Messages = typeof en;

export const dictionaries = { en, it };

/** fill("{v} left", { v: "12" }) -> "12 left". Unknown placeholders stay visible. */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => vars[key] ?? whole);
}

/** The labels of ui/MacroStrip, from a dictionary: one place, not one per use. */
export function macroLabels(t: Pick<Messages, "nutrients" | "macro">) {
  return {
    protein: t.nutrients.protein,
    carbs: t.nutrients.carbs,
    fat: t.nutrients.fat,
    fiber: t.nutrients.fiber,
    sugars: t.nutrients.sugars,
    saturatedFat: t.nutrients.saturatedFat,
    salt: t.nutrients.salt,
    split: t.macro.splitTitle,
    short: t.macro.short,
  };
}

/** The labels of ui/QualityBadges (ADR-0012), from a dictionary. */
export function qualityLabels(t: Pick<Messages, "quality">) {
  return {
    nova: (n: number) => fill(t.quality.novaShort, { n: String(n) }),
    origin: (o: string) =>
      t.quality.origins[o as keyof Messages["quality"]["origins"]] ?? o,
    fiber: (f: string) =>
      t.quality.fiberNames[f as keyof Messages["quality"]["fiberNames"]] ?? f,
  };
}
