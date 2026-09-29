/**
 * features/nutrition/log/EntryList.tsx — what was eaten on the day, in order.
 *
 * Each entry shows its label (the name at logging time — ADR-0007), servings
 * if not 1, energy and macros, an expandable list of what it contained, and
 * a remove button. The remove button is
 * a tiny form bound to that entry's id (ui/ActionButtonForm).
 */
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { DayView } from "@/core/nutrition/repositories/log";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ActionButtonForm, type ActionButtonState } from "@/ui/ActionButtonForm";

type Props = {
  day: DayView;
  locale: Locale;
  /** Server action to delete one entry, given its id. */
  removeAction: (
    id: string,
  ) => (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;
  t: Pick<Messages, "day" | "nutrients" | "macro">;
};

export function EntryList({ day, locale, removeAction, t }: Props) {
  if (day.entries.length === 0) return <p className="text-muted">{t.day.empty}</p>;
  return (
    <ol className="flex flex-col">
      {day.entries.map((e) => (
        <li
          key={e.id}
          className="flex items-start justify-between gap-3 border-b border-hairline py-2"
        >
          <div>
            <p className="font-semibold">
              {e.label}
              {e.servings !== "1.00" && (
                <span className="pl-2 font-display text-muted">
                  {fill(t.day.servingsTimes, { n: formatNumber(e.servings, locale, 2) })}
                </span>
              )}
            </p>
            <p className="font-display text-sm text-muted tabular-nums">
              {`${formatNumber(e.totals.nutrients.kcal, locale)} ${NUTRIENT_UNIT.kcal} · ${t.macro.protein} ${formatNumber(e.totals.nutrients.protein, locale)} · ${t.macro.carbs} ${formatNumber(e.totals.nutrients.carbs, locale)} · ${t.macro.fat} ${formatNumber(e.totals.nutrients.fat, locale)}`}
            </p>
            {/* Native <details>: expandable with no JavaScript. Shows what the
                entry was made of, as logged (the ADR-0007 snapshot). */}
            {e.lines.length > 1 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted">
                  {fill(t.macro.ingredientsCount, { n: String(e.lines.length) })}
                </summary>
                <ul className="pt-1 pl-4">
                  {e.lines.map((l, i) => (
                    <li key={i} className="tabular-nums">
                      {`${l.name} — ${formatNumber(l.quantity, locale, 0)} ${l.unit}`}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
          <ActionButtonForm
            action={removeAction(e.id)}
            label={t.day.remove}
            variant="quiet"
          />
        </li>
      ))}
    </ol>
  );
}
