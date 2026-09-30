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
import { timeIn } from "@/core/shared/dates";
import type { FormState } from "@/core/shared/result";
import { StatusToggle } from "./StatusToggle";
import { TimeEditor } from "./TimeEditor";
type EntryAction = (
  id: string,
) => (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;

type Props = {
  day: DayView;
  locale: Locale;
  /** The user's time zone: entry times are shown in it. */
  timeZone: string;
  removeAction: EntryAction;
  refreshAction: EntryAction;
  /** Tick / untick (ADR-0009), bound per entry and target status. */
  statusAction: (
    id: string,
    status: "planned" | "eaten",
  ) => (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;
  /** Edit the time, bound per entry. */
  timeAction: (id: string) => (prev: FormState, formData: FormData) => Promise<FormState>;
  t: Pick<Messages, "day" | "nutrients" | "macro" | "errors">;
};
export function EntryList({
  day,
  locale,
  timeZone,
  removeAction,
  refreshAction,
  statusAction,
  timeAction,
  t,
}: Props) {
  if (day.entries.length === 0) return <p className="text-muted">{t.day.empty}</p>;
  const n = (v: string) => formatNumber(v, locale, 0);
  return (
    <ol className="flex flex-col">
      {day.entries.map((e) => {
        const tn = e.totals.nutrients;
        return (
          <li
            key={e.id}
            // Planned (ADR-0009): translucent with a dashed edge; eaten: solid.
            className={`flex flex-col gap-1 border-b border-hairline py-2 ${
              e.status === "planned"
                ? "rule-l-strong border-l-hairline border-dashed pl-2 opacity-60"
                : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <StatusToggle
                  eaten={e.status === "eaten"}
                  action={statusAction(e.id, e.status === "eaten" ? "planned" : "eaten")}
                  labels={{ markEaten: t.day.markEaten, markPlanned: t.day.markPlanned }}
                />
                <p className="pt-1 font-semibold">
                  {e.at && (
                    <span className="pr-2 font-display text-muted tabular-nums">
                      {timeIn(new Date(e.at), timeZone)}
                    </span>
                  )}
                  {e.estimated && <span aria-hidden="true">~</span>}
                  {e.label}
                  {e.servings !== "1.00" && (
                    <span className="pl-2 font-display text-muted">
                      {fill(t.day.servingsTimes, {
                        n: formatNumber(e.servings, locale, 2),
                      })}
                    </span>
                  )}
                </p>
                {e.estimated && (
                  <span className="mt-1 border border-hairline px-1 text-xs text-muted">
                    {t.day.estimated}
                  </span>
                )}
              </div>
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
                <TimeEditor
                  action={timeAction(e.id)}
                  initial={e.at ? timeIn(new Date(e.at), timeZone) : ""}
                  t={t}
                />
              </div>
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
