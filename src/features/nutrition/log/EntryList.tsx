/**
 * features/nutrition/log/EntryList.tsx — what was eaten on the day, grouped
 * by moment (breakfast, lunch, snack, dinner — ADR-0011; entries without one
 * take it from their time), each group with its eaten kcal.
 *
 * Each entry, in the shared row (ui/ListItem): its label (the name at
 * logging time — ADR-0007), servings if not 1, energy and macros as a colour
 * strip (ui/MacroStrip), its cost, what it is made of (NOVA, origin, fibre,
 * tags, rating — the meal cards' block, passed in by the page), a compact
 * remove button (to the trash with Undo,
 * ui/TrashButton), and a "Details" disclosure
 * (native <details>, no JavaScript) with what the entry contained and the
 * "update with current values" action —
 * the deliberate way to apply later corrections, e.g. a price added after
 * logging (core refreshLogEntry).
 */
import { RefreshCw, Tag } from "lucide-react";
import { detailLines, stripValues } from "@/core/nutrition/display";
import { groupByMoment, type MomentBounds } from "@/core/nutrition/moments";
import { entriesTotals } from "@/core/nutrition/totals";
import type { DayView, LogEntryView } from "@/core/nutrition/repositories/log";
import type { ReactNode } from "react";
import { formatCents, formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, macroLabels, type Messages } from "@/i18n";
import { ActionButtonForm, type ActionButtonState } from "@/ui/ActionButtonForm";
import { FoodDetails } from "@/ui/FoodDetails";
import { Collapsible } from "@/ui/Collapsible";
import { ListItem } from "@/ui/ListItem";
import { MOMENT_TEXT, MomentIcon } from "@/ui/MomentIcon";
import { MacroStrip } from "@/ui/MacroStrip";
import { TrashButton } from "@/ui/TrashButton";
import { timeIn } from "@/core/shared/dates";
import type { FormState } from "@/core/shared/result";
import { StatusToggle } from "./StatusToggle";
import { TimeEditor } from "./TimeEditor";
import { Badge } from "@/ui/Badge";
type EntryAction = (
  id: string,
) => (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;

type Props = {
  day: DayView;
  locale: Locale;
  /** The user's time zone: entry times are shown in it. */
  timeZone: string;
  /** Where the moments start (preferences). */
  bounds: MomentBounds;
  /** To the trash and back (ADR-0015): server actions, passed as they are. */
  trash: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
  refreshAction: EntryAction;
  /** Tick / untick (ADR-0009), bound per entry and target status. */
  statusAction: (
    id: string,
    status: "planned" | "eaten",
  ) => (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;
  /** Edit the time, bound per entry. */
  timeAction: (id: string) => (prev: FormState, formData: FormData) => Promise<FormState>;
  /**
   * What the entry is made of (NOVA, origin, fibre, tags, rating): the same
   * block as the meal cards, composed by the page (another slice's component).
   */
  quality?: (entry: LogEntryView) => ReactNode;
  t: Pick<
    Messages,
    "day" | "nutrients" | "macro" | "errors" | "moments" | "actions" | "label"
  >;
};
export function EntryList({
  day,
  locale,
  timeZone,
  bounds,
  trash,
  restore,
  refreshAction,
  statusAction,
  timeAction,
  quality,
  t,
}: Props) {
  if (day.entries.length === 0) return <p className="text-muted">{t.day.empty}</p>;
  const labels = macroLabels(t);
  return (
    // Grouped by moment of the day (ADR-0011), each with its eaten kcal.
    <div className="flex flex-col gap-4">
      {groupByMoment(day.entries, timeZone, bounds).map((group) => (
        <Collapsible
          key={group.moment ?? "none"}
          id={`day-moment-${group.moment ?? "none"}`}
          title={
            <span
              className={`flex items-center gap-1.5 ${
                (group.moment && MOMENT_TEXT[group.moment]) || ""
              }`}
            >
              <MomentIcon moment={group.moment} />
              {group.moment ? t.moments.names[group.moment] : t.moments.none}
            </span>
          }
          aside={fill(t.moments.subtotal, {
            v: formatNumber(group.eatenKcal, locale, 0),
          })}
          summary={
            <MacroStrip
              values={stripValues(entriesTotals(group.entries).nutrients, locale)}
              labels={labels}
            />
          }
        >
          <ol className="flex flex-col">
            {group.entries.map((e) => {
              return (
                <ListItem
                  key={e.id}
                  muted={e.status === "planned"}
                  leading={
                    <StatusToggle
                      eaten={e.status === "eaten"}
                      action={statusAction(
                        e.id,
                        e.status === "eaten" ? "planned" : "eaten",
                      )}
                      labels={{
                        markEaten: t.day.markEaten,
                        markPlanned: t.day.markPlanned,
                      }}
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
                        <span className="ml-2 inline-flex align-middle">
                          <Badge>{t.day.estimated}</Badge>
                        </span>
                      )}
                    </>
                  }
                  aside={
                    // Cost as on the meal cards; nothing when no price is known.
                    e.totals.costCents > 0 && (
                      <span className="inline-flex items-center gap-1 text-price">
                        <Tag size={14} aria-hidden="true" />
                        {e.totals.costComplete
                          ? formatCents(e.totals.costCents, locale)
                          : fill(t.label.costPartialShort, {
                              v: formatCents(e.totals.costCents, locale),
                            })}
                      </span>
                    )
                  }
                  action={
                    <TrashButton
                      id={e.id}
                      name={e.label}
                      trash={trash}
                      restore={restore}
                      label={t.day.remove}
                      labels={t.actions}
                    />
                  }
                >
                  <MacroStrip
                    values={stripValues(e.totals.nutrients, locale)}
                    labels={labels}
                  />
                  {quality?.(e)}
                  <FoodDetails
                    summary={
                      e.lines.length > 1
                        ? fill(t.macro.ingredientsCount, { n: String(e.lines.length) })
                        : t.day.details
                    }
                    lines={detailLines(e.lines, e.servings, locale)}
                    labels={labels}
                  >
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
                        size="sm"
                      />
                    </div>
                    <p className="text-meta text-muted">{t.day.refreshHint}</p>
                  </FoodDetails>
                </ListItem>
              );
            })}
          </ol>
        </Collapsible>
      ))}
    </div>
  );
}
