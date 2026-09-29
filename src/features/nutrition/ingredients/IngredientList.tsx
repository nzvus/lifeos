/**
 * features/nutrition/ingredients/IngredientList.tsx — the ingredient table.
 *
 * A SERVER component (no "use client"): it renders to HTML on the server and
 * sends no JavaScript to the browser. It receives rows already loaded by the
 * page; it doesn't fetch anything itself.
 *
 * Shows the four numbers people scan for (kcal, protein, carbs, fat per 100)
 * plus price per kg/l, computed from the package price for comparability.
 */
import Link from "next/link";
import type { Ingredient } from "@/core/nutrition/repositories/ingredients";
import { Big } from "@/core/shared/decimal";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

type Props = {
  ingredients: Ingredient[];
  locale: Locale;
  t: Pick<Messages, "ingredients" | "nutrients">;
};

const COLUMNS = ["kcal", "protein", "carbs", "fat"] as const;

/** Price of 1000 g/ml in cents, or null if the ingredient has no price. */
function pricePerThousand(i: Ingredient): number | null {
  if (i.packagePriceCents === null || i.packageSize === null) return null;
  return new Big(i.packagePriceCents).times(1000).div(i.packageSize).round(0).toNumber();
}

export function IngredientList({ ingredients, locale, t }: Props) {
  if (ingredients.length === 0)
    return <p className="text-muted">{t.ingredients.empty}</p>;
  return (
    // overflow-x-auto: on a narrow phone the table scrolls sideways instead of
    // squeezing numbers into unreadable columns.
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-6 border-ink font-display text-sm">
            <th className="py-2 pr-3">{t.ingredients.name}</th>
            {COLUMNS.map((k) => (
              <th key={k} className="px-2 py-2 text-right">
                {t.nutrients[k]}
              </th>
            ))}
            <th className="py-2 pl-2 text-right">{t.ingredients.pricePerThousand}</th>
          </tr>
        </thead>
        <tbody>
          {ingredients.map((i) => {
            const price = pricePerThousand(i);
            return (
              <tr key={i.id} className="border-b border-hairline">
                <td className="py-2 pr-3">
                  <Link
                    href={`/ingredients/${i.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {i.name}
                  </Link>
                  <span className="pl-1 text-sm text-muted">
                    {fill(t.ingredients.per100Short, { unit: i.unit })}
                  </span>
                </td>
                {COLUMNS.map((k) => (
                  <td key={k} className="px-2 py-2 text-right font-display tabular-nums">
                    {formatNumber(i[k], locale)}
                  </td>
                ))}
                <td className="py-2 pl-2 text-right font-display tabular-nums">
                  {price === null ? "—" : formatCents(price, locale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
