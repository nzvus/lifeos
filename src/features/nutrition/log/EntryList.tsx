/**
 * features/nutrition/log/EntryList.tsx — what was eaten on the day, in order.
 *
 * Each entry shows its label (the name at logging time — ADR-0007), servings
 * if not 1, its energy and protein, and a remove button. The remove button is
 * a tiny form bound to that entry's id (ui/ActionButtonForm).
 */
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
  t: Pick<Messages, "day" | "nutrients">;
};

export function EntryList({ day, locale, removeAction, t }: Props) {
  if (day.entries.length === 0) return <p className="text-muted">{t.day.empty}</p>;
  return (
    <ol className="flex flex-col">
      {day.entries.map((e) => (
        <li
          key={e.id}
          className="flex items-center justify-between gap-3 border-b border-hairline py-2"
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
            <p className="font-display text-sm tabular-nums text-muted">
              {t.nutrients.kcal} {formatNumber(e.totals.nutrients.kcal, locale)} ·{" "}
              {t.nutrients.protein} {formatNumber(e.totals.nutrients.protein, locale)}
            </p>
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
