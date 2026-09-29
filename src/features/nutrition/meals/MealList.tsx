/**
 * features/nutrition/meals/MealList.tsx — meals with their per-serving totals.
 * Server component; totals arrive precomputed from core (the UI never sums).
 */
import Link from "next/link";
import type { MealWithLines } from "@/core/nutrition/repositories/meals";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

type Props = {
  meals: MealWithLines[];
  locale: Locale;
  t: Pick<Messages, "meals" | "nutrients" | "label">;
};

const SHOWN = ["kcal", "protein", "carbs", "fat"] as const;

export function MealList({ meals, locale, t }: Props) {
  if (meals.length === 0) return <p className="text-muted">{t.meals.empty}</p>;
  return (
    <ul className="flex flex-col">
      {meals.map((m) => (
        <li key={m.id} className="border-b-2 border-ink py-3">
          <div className="flex items-baseline justify-between gap-3">
            <Link
              href={`/meals/${m.id}`}
              className="font-display text-xl font-bold underline-offset-4 hover:underline"
            >
              {m.name}
            </Link>
            <span className="text-sm text-muted">{t.meals.perServing}</span>
          </div>
          <dl className="grid grid-cols-5 gap-2 pt-1 text-sm">
            {SHOWN.map((k) => (
              <div key={k}>
                <dt className="text-muted">{t.nutrients[k]}</dt>
                <dd className="font-display text-lg tabular-nums">
                  {formatNumber(m.totals.nutrients[k], locale)}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-muted">{t.label.cost}</dt>
              <dd className="font-display text-lg tabular-nums">
                {m.totals.costComplete
                  ? formatCents(m.totals.costCents, locale)
                  : fill(t.label.costPartialShort, {
                      v: formatCents(m.totals.costCents, locale),
                    })}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
