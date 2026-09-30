/**
 * features/nutrition/log/EntryList.tsx — what was eaten on the day, in order.
 *
 * Each entry: its label (the name at logging time — ADR-0007), servings if
 * not 1, energy and macros as a colour strip (ui/MacroStrip), a remove
 * button, and a "Details" disclosure (native <details>, no JavaScript) with
 * what the entry contained and the "update with current values" action —
 * the deliberate way to apply later corrections, e.g. a price added after
 * logging (core refreshLogEntry).
 */
import { RefreshCw, Trash2 } from "lucide-react";
import { macroSplit } from "@/core/nutrition/insights";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { DayView } from "@/core/nutrition/repositories/log";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ActionButtonForm, type ActionButtonState } from "@/ui/ActionButtonForm";
import { MacroStrip } from "@/ui/MacroStrip";

type EntryAction = (
  id: string,
) => (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;

type Props = {
  day: DayView;
  locale: Locale;
  removeAction: EntryAction;
  refreshAction: EntryAction;
  t: Pick<Messages, "day" | "nutrients" | "macro">;
};

export function EntryList({ day, locale, removeAction, refreshAction, t }: Props) {
  if (day.entries.length === 0) return <p className="text-muted">{t.day.empty}</p>;
  const n = (v: string) => formatNumber(v, locale, 0);
  return (
    <ol className="flex flex-col">
      {day.entries.map((e) => {
        const tn = e.totals.nutrients;
        return (
          <li key={e.id} className="flex flex-col gap-1 border-b border-hairline py-2">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">
                {e.label}
                {e.servings !== "1.00" && (
                  <span className="pl-2 font-display text-muted">
                    {fill(t.day.servingsTimes, {
                      n: formatNumber(e.servings, locale, 2),
                    })}
                  </span>
                )}
              </p>
              <ActionButtonForm
                action={removeAction(e.id)}
                label={t.day.remove}
                icon={<Trash2 size={16} aria-hidden="true" />}
                variant="quiet"
              />
            </div>
            <MacroStrip
              energy={`${n(tn.kcal)} ${NUTRIENT_UNIT.kcal}`}
              protein={n(tn.protein)}
              carbs={n(tn.carbs)}
              fat={n(tn.fat)}
              fiber={n(tn.fiber)}
              split={macroSplit(tn)}
              labels={{
                protein: t.nutrients.protein,
                carbs: t.nutrients.carbs,
                fat: t.nutrients.fat,
                fiber: t.nutrients.fiber,
                split: t.macro.splitTitle,
              }}
            />
            <details className="text-sm">
              <summary className="cursor-pointer text-muted">
                {e.lines.length > 1
                  ? fill(t.macro.ingredientsCount, { n: String(e.lines.length) })
                  : t.day.details}
              </summary>
              <ul className="pt-1 pl-4">
                {e.lines.map((l, i) => (
                  <li key={i} className="tabular-nums">
                    {`${l.name} — ${formatNumber(l.quantity, locale, 0)} ${l.unit}`}
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <ActionButtonForm
                  action={refreshAction(e.id)}
                  label={t.day.refresh}
                  icon={<RefreshCw size={16} aria-hidden="true" />}
                  variant="quiet"
                />
                <p className="pt-1 text-xs text-muted">{t.day.refreshHint}</p>
              </div>
            </details>
          </li>
        );
      })}
    </ol>
  );
}
