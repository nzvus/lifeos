/**
 * features/nutrition/log/EntryList.tsx — what was eaten on the day, in order.
 *
 * Each entry, in the shared row (ui/ListItem): its label (the name at
 * logging time — ADR-0007), servings if not 1, energy and macros as a colour
 * strip (ui/MacroStrip), a compact remove button, and a "Details" disclosure
 * (native <details>, no JavaScript) with what the entry contained and the
 * "update with current values" action —
 * the deliberate way to apply later corrections, e.g. a price added after
 * logging (core refreshLogEntry).
 */
import { RefreshCw, Trash2 } from "lucide-react";
import { macroSplit } from "@/core/nutrition/insights";
import { sumLines, toDisplay } from "@/core/nutrition/totals";
import { NUTRIENT_UNIT } from "@/core/nutrition/nutrients";
import type { DayView } from "@/core/nutrition/repositories/log";
import { Big } from "@/core/shared/decimal";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ActionButtonForm, type ActionButtonState } from "@/ui/ActionButtonForm";
import { ListItem } from "@/ui/ListItem";
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
          <ListItem
            key={e.id}
            muted={e.status === "planned"}
            leading={
              <StatusToggle
                eaten={e.status === "eaten"}
                action={statusAction(e.id, e.status === "eaten" ? "planned" : "eaten")}
                labels={{ markEaten: t.day.markEaten, markPlanned: t.day.markPlanned }}
              />
            }
            title={
              <>
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
                {e.estimated && (
                  <span className="ml-2 border border-hairline px-1 text-meta font-normal text-muted">
                    {t.day.estimated}
                  </span>
                )}
              </>
            }
            action={
              <ActionButtonForm
                action={removeAction(e.id)}
                label={t.day.remove}
                icon={<Trash2 size={18} aria-hidden="true" />}
                variant="quiet"
                iconOnly
              />
            }
          >
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
            <details className="text-meta">
              <summary className="cursor-pointer text-muted">
                {e.lines.length > 1
                  ? fill(t.macro.ingredientsCount, { n: String(e.lines.length) })
                  : t.day.details}
              </summary>
              {/* Indented under a hairline: clearly part of this entry. */}
              <div className="mt-1 ml-2 flex flex-col gap-3 border-l border-hairline pl-3">
                {/* Each ingredient with its own macro strip and bar (the
                    same display as every row), servings applied. */}
                <ul className="flex flex-col gap-2">
                  {e.lines.map((l, i) => {
                    const ln = toDisplay(sumLines([l], e.servings)).nutrients;
                    return (
                      <li key={i} className="flex flex-col gap-0.5">
                        <span>
                          {l.name}
                          <span className="pl-2 font-display text-muted tabular-nums">
                            {/* What was eaten: per-serving quantity × servings. */}
                            {`${formatNumber(new Big(l.quantity).times(e.servings).toString(), locale, 0)} ${l.unit}`}
                          </span>
                        </span>
                        <MacroStrip
                          energy={`${n(ln.kcal)} ${NUTRIENT_UNIT.kcal}`}
                          protein={n(ln.protein)}
                          carbs={n(ln.carbs)}
                          fat={n(ln.fat)}
                          fiber={n(ln.fiber)}
                          split={macroSplit(ln)}
                          labels={{
                            protein: t.nutrients.protein,
                            carbs: t.nutrients.carbs,
                            fat: t.nutrients.fat,
                            fiber: t.nutrients.fiber,
                            split: t.macro.splitTitle,
                          }}
                        />
                      </li>
                    );
                  })}
                </ul>
                <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                  <TimeEditor
                    action={timeAction(e.id)}
                    initial={e.at ? timeIn(new Date(e.at), timeZone) : ""}
                    t={t}
                  />
                  <ActionButtonForm
                    action={refreshAction(e.id)}
                    label={t.day.refresh}
                    icon={<RefreshCw size={14} aria-hidden="true" />}
                    variant="subtle"
                    size="small"
                  />
                </div>
                <p className="text-meta text-muted">{t.day.refreshHint}</p>
              </div>
            </details>
          </ListItem>
        );
      })}
    </ol>
  );
}
