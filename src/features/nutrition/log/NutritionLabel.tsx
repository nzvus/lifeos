/**
 * features/nutrition/log/NutritionLabel.tsx — the day's totals, drawn as a
 * nutrition label, each row compared with its daily target.
 *
 * Server component. Receives display totals (already rounded by core) and the
 * targets; the comparison maths comes from core/nutrition/targets.ts. This
 * file only decides how it LOOKS:
 *   - heavy rule under the title, medium rule under energy, hairlines between
 *     rows — the structure of the real label;
 *   - "of which" rows (sugars, saturated fat) indented, as on the label;
 *   - a thin bar per row: herb green while under target, tomato once over.
 */
import type { NutrientKey } from "@/core/nutrition/nutrients";
import { NUTRIENT_KEYS, NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import { compareToTarget } from "@/core/nutrition/targets";
import type { DisplayTotals } from "@/core/nutrition/totals";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

type Props = {
  totals: DisplayTotals;
  targets: Record<NutrientKey, string | null>;
  locale: Locale;
  t: Pick<Messages, "label" | "nutrients">;
};

/** Sub-rows of the label ("of which ..."), indented. */
const SUB_ROWS: ReadonlySet<NutrientKey> = new Set(["sugars", "saturatedFat"]);

export function NutritionLabel({ totals, targets, locale, t }: Props) {
  const anyTarget = NUTRIENT_KEYS.some((k) => targets[k] !== null);
  return (
    <section
      aria-labelledby="label-title"
      className="border-4 border-ink bg-sheet px-4 py-3"
    >
      <h2
        id="label-title"
        className="border-b-6 border-ink pb-1 font-display text-3xl font-extrabold"
      >
        {t.label.title}
      </h2>
      <table className="w-full border-collapse">
        <tbody>
          {NUTRIENT_KEYS.map((k) => {
            const cmp = compareToTarget(totals.nutrients[k], targets[k]);
            const unit = NUTRIENT_UNIT[k];
            const value = `${formatNumber(totals.nutrients[k], locale)} ${unit}`;
            return (
              <tr
                key={k}
                className={
                  k === "kcal" ? "border-b-2 border-ink" : "border-b border-hairline"
                }
              >
                <th
                  scope="row"
                  className={`py-2 text-left align-top font-normal ${SUB_ROWS.has(k) ? "pl-5 text-muted" : "font-semibold"}`}
                >
                  {t.nutrients[k]}
                </th>
                <td className="py-2 text-right align-top">
                  <span
                    className={`font-display tabular-nums ${k === "kcal" ? "text-3xl font-bold" : "text-xl"}`}
                  >
                    {value}
                  </span>
                  {cmp.status !== "none" && (
                    <>
                      {/* The bar: its width is the share of the target reached. */}
                      <span
                        className="mt-1 block h-1 w-full bg-hairline"
                        aria-hidden="true"
                      >
                        <span
                          className={`block h-1 ${cmp.status === "over" ? "bg-tomato" : "bg-herb"}`}
                          style={{ width: `${cmp.percent}%` }}
                        />
                      </span>
                      <span
                        className={`block text-sm ${cmp.status === "over" ? "font-semibold text-tomato" : "text-muted"}`}
                      >
                        {cmp.status === "over"
                          ? fill(t.label.over, {
                              v: `${formatNumber(cmp.over, locale)} ${unit}`,
                            })
                          : fill(t.label.remaining, {
                              v: `${formatNumber(cmp.remaining, locale)} ${unit}`,
                            })}
                      </span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          <tr>
            <th scope="row" className="pt-3 text-left font-semibold">
              {t.label.cost}
            </th>
            <td className="pt-3 text-right font-display text-xl tabular-nums">
              {totals.costComplete
                ? formatCents(totals.costCents, locale)
                : fill(t.label.costPartial, { v: formatCents(totals.costCents, locale) })}
            </td>
          </tr>
        </tbody>
      </table>
      {!anyTarget && <p className="pt-2 text-sm text-muted">{t.label.setTargets}</p>}
    </section>
  );
}
