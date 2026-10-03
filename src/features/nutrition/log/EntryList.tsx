/**
 * features/nutrition/log/EntryList.tsx — what was eaten on the day, grouped
 * by moment (breakfast, lunch, snack, dinner — ADR-0011; entries without one
 * take it from their time), each group with its eaten kcal.
 *
 * Each entry, in the shared row (ui/ListItem): its label (the name at
 * logging time — ADR-0007), servings if not 1, energy and macros as a colour
 * strip (ui/MacroStrip), its cost, what it is made of (NOVA, origin, fibre,
 * tags, rating — the meal cards' block, passed in by the page), the "⋯" of
 * every row (ui/TrashMenu): "update with current values" — the deliberate
 * way to apply later corrections, e.g. a price added after logging (core
 * refreshLogEntry) — and delete with Undo; then a "Details" disclosure
 * (native <details>) with what the entry contained and its time.
 *
 * The tick, the −/+ and the numbers they change are live (./LiveDay.tsx):
 * they answer at once and the server follows. The page wraps the list in
 * <LiveDay>.
 */
import { Pencil, Tag } from "lucide-react";
import { detailLines } from "@/core/nutrition/display";
import { groupByMoment, type MomentBounds } from "@/core/nutrition/moments";
import type { DayView, LogEntryView } from "@/core/nutrition/repositories/log";
import type { ReactNode } from "react";
import { formatCents } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, macroLabels, type Messages } from "@/i18n";
import type { ActionButtonState } from "@/ui/ActionButtonForm";
import { FoodDetails } from "@/ui/FoodDetails";
import { Collapsible } from "@/ui/Collapsible";
import { ListItem } from "@/ui/ListItem";
import { MOMENT_TEXT, MomentIcon } from "@/ui/MomentIcon";
import { TrashMenu } from "@/ui/TrashMenu";
import { timeIn } from "@/core/shared/dates";
import type { FormState } from "@/core/shared/result";
import {
  LiveEntryStrip,
  LiveGroupKcal,
  LiveGroupStrip,
  LiveServings,
  LiveStatusToggle,
  LiveTimes,
} from "./LiveDay";
import { TimeEditor } from "./TimeEditor";
import { Badge } from "@/ui/Badge";
type Props = {
  day: DayView;
  /** A day still to come: planned entries can't be ticked as eaten. */
  future?: boolean;
  locale: Locale;
  /** The user's time zone: entry times are shown in it. */
  timeZone: string;
  /** Where the moments start (preferences). */
  bounds: MomentBounds;
  /** To the trash and back (ADR-0015): server actions, passed as they are. */
  trash: (id: string) => Promise<{ ok: boolean; message?: string }>;
  restore: (id: string) => Promise<{ ok: boolean; message?: string }>;
  /** "Update with current values" (core refreshLogEntry): a server action. */
  refresh: (id: string) => Promise<{ ok: boolean; message?: string }>;
  /** Tick / untick (ADR-0009), bound per entry and target status. */
  statusAction: (
    id: string,
    status: "planned" | "eaten",
  ) => (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;
  /** Edit the time, bound per entry. */
  timeAction: (id: string) => (prev: FormState, formData: FormData) => Promise<FormState>;
  /** The −/+ multiplier of an entry (a plain form). */
  servingsAction: (id: string) => (formData: FormData) => Promise<void>;
  /**
   * What the entry is made of (NOVA, origin, fibre, tags, rating): the same
   * block as the meal cards, composed by the page (another slice's component).
   */
  quality?: (entry: LogEntryView) => ReactNode;
  t: Pick<
    Messages,
    | "day"
    | "nutrients"
    | "macro"
    | "errors"
    | "moments"
    | "actions"
    | "label"
    | "entryEdit"
  >;
};
export function EntryList({
  day,
  future = false,
  locale,
  timeZone,
  bounds,
  trash,
  restore,
  refresh,
  statusAction,
  timeAction,
  servingsAction,
  quality,
  t,
}: Props) {
  if (day.entries.length === 0) return <p className="text-muted">{t.day.empty}</p>;
  const labels = macroLabels(t);
  return (
    // Grouped by moment of the day (ADR-0011), each with its eaten kcal.
    <div className="flex flex-col gap-3">
      {groupByMoment(day.entries, timeZone, bounds).map((group) => (
        <Collapsible
          key={group.moment ?? "none"}
          id={`day-moment-${group.moment ?? "none"}`}
          inset
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
          aside={
            <LiveGroupKcal
              ids={group.entries.map((e) => e.id)}
              locale={locale}
              text={t.moments.subtotal}
            />
          }
          summary={
            <LiveGroupStrip
              ids={group.entries.map((e) => e.id)}
              locale={locale}
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
                    <LiveStatusToggle
                      id={e.id}
                      toEaten={statusAction(e.id, "eaten")}
                      toPlanned={statusAction(e.id, "planned")}
                      future={future}
                      labels={{
                        markEaten: t.day.markEaten,
                        markPlanned: t.day.markPlanned,
                        future: t.errors.future_day,
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
                      <LiveTimes id={e.id} locale={locale} t={t.day} />
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
                    <TrashMenu
                      id={e.id}
                      name={e.label}
                      trash={trash}
                      restore={restore}
                      items={
                        e.estimated || e.batchId
                          ? []
                          : [
                              {
                                label: t.entryEdit.edit,
                                icon: <Pencil size={16} aria-hidden="true" />,
                                href: `/log/${e.id}?from=${encodeURIComponent(`/?day=${e.day}`)}`,
                              },
                            ]
                      }
                      actions={[
                        { label: t.day.refresh, run: refresh, done: t.day.refreshed },
                      ]}
                      labels={t.actions}
                    />
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <LiveEntryStrip id={e.id} locale={locale} labels={labels} />
                    </div>
                    {!e.batchId && (
                      <LiveServings
                        id={e.id}
                        action={servingsAction(e.id)}
                        locale={locale}
                        t={t.day}
                      />
                    )}
                  </div>
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
                    <TimeEditor
                      action={timeAction(e.id)}
                      initial={e.at ? timeIn(new Date(e.at), timeZone) : ""}
                      t={t}
                    />
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
