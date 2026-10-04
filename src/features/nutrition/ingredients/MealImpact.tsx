/**
 * features/nutrition/ingredients/MealImpact.tsx — while an ingredient's label
 * is being edited: how every meal that uses it would change, per serving,
 * per nutrient, in percent ("Bowl: kcal 309 → 311 (+1%) · P +7%").
 *
 * Nothing is saved or recomputed on the server: the new values come from
 * core/nutrition/preview.ts (meal − old line + new line), exact.
 */
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import {
  percentChange,
  PREVIEW_KEYS,
  replaceIngredient,
  type MacroValues,
  type MealUse,
} from "@/core/nutrition/preview";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

type Props = {
  usedIn: readonly MealUse[];
  before: MacroValues | null;
  after: MacroValues | null;
  unit: string;
  locale: Locale;
  t: Pick<Messages, "ingredients" | "macro" | "nutrients">;
};

const signed = (n: number) => (n > 0 ? `+${n}%` : `${n}%`);

export function MealImpact({ usedIn, before, after, unit, locale, t }: Props) {
  if (usedIn.length === 0) return null;
  const short: Record<(typeof PREVIEW_KEYS)[number], string> = {
    kcal: NUTRIENT_UNIT.kcal,
    protein: t.macro.protein,
    carbs: t.macro.carbs,
    fat: t.macro.fat,
    fiber: t.nutrients.fiber,
    sugars: t.nutrients.sugars,
    saturatedFat: t.nutrients.saturatedFat,
    salt: t.nutrients.salt,
  };
  return (
    <div className="flex flex-col gap-2 pt-2">
      <p className="text-meta font-semibold text-muted">
        {fill(t.ingredients.impactTitle, { n: String(usedIn.length) })}
      </p>
      <ul className="flex flex-col gap-1.5 text-meta">
        {usedIn.map((m) => {
          const changed =
            before && after
              ? replaceIngredient(m.serving, m.quantity, before, after)
              : null;
          const deltas = changed
            ? PREVIEW_KEYS.map((k) => ({
                k,
                pct: percentChange(m.serving[k], changed[k]),
              })).filter((d) => d.pct !== null && d.pct !== 0)
            : [];
          return (
            <li key={m.id} className="flex flex-col">
              {/* Name and quantity side by side: a long name wraps on its own. */}
              <span className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 font-semibold">{m.name}</span>
                <span className="shrink-0 font-display whitespace-nowrap text-muted tabular-nums">
                  {fill(t.ingredients.impactQuantity, {
                    q: formatNumber(m.quantity, locale, 0),
                    unit,
                  })}
                </span>
              </span>
              <span className="font-display text-muted tabular-nums">
                {changed === null || deltas.length === 0
                  ? t.ingredients.impactNone
                  : [
                      `${formatNumber(m.serving.kcal, locale, 0)} → ${formatNumber(changed.kcal, locale, 0)} ${NUTRIENT_UNIT.kcal}`,
                      ...deltas.map((d) => `${short[d.k]} ${signed(d.pct!)}`),
                    ].join(" · ")}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
