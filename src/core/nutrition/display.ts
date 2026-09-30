/**
 * core/nutrition/display.ts — nutrients turned into the ready-to-show values
 * of the one macro display (ui/MacroStrip) and of the lines inside a food's
 * details (ui/FoodDetails). Every list — ingredients, meals, the day's
 * entries, the add-to-day preview — goes through here, so a number is
 * formatted the same way everywhere and no screen repeats the recipe.
 *
 * Pure; ui/ may not import core (ADR-0002), so the shapes are plain strings
 * that ui/ describes structurally.
 */
import { formatNumber } from "../shared/format";
import { Big } from "../shared/decimal";
import type { Locale } from "../shared/locales";
import { macroSplit, type MacroSplit } from "./insights";
import { NUTRIENT_UNIT } from "./nutrients";
import { sumLines, toDisplay, type TotalsLine } from "./totals";

type Macros = {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
};

/** Formatted values for ui/MacroStrip: kcal with its unit, grams without. */
export type StripValues = {
  energy: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  split: MacroSplit | null;
};

export function stripValues(n: Macros, locale: Locale, decimals = 0): StripValues {
  const f = (v: string) => formatNumber(v, locale, decimals);
  return {
    energy: `${formatNumber(n.kcal, locale, 0)} ${NUTRIENT_UNIT.kcal}`,
    protein: f(n.protein),
    carbs: f(n.carbs),
    fat: f(n.fat),
    fiber: f(n.fiber),
    split: macroSplit(n),
  };
}

/** One line inside a food's details: what, how much, and its macros. */
export type DetailLine = { name: string; amount: string; values: StripValues };

/**
 * The lines of a meal or a logged entry, each multiplied by `factor` (the
 * servings eaten; "1" for a meal's own serving). The amount shown is the
 * quantity actually eaten, so grams and kcal agree.
 */
export function detailLines(
  lines: readonly (TotalsLine & { name: string; unit: string })[],
  factor: string,
  locale: Locale,
): DetailLine[] {
  return lines.map((l) => ({
    name: l.name,
    amount: `${formatNumber(new Big(l.quantity).times(factor).toString(), locale, 0)} ${l.unit}`,
    values: stripValues(toDisplay(sumLines([l], factor)).nutrients, locale),
  }));
}
