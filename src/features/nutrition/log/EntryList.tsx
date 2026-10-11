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
import { Pencil, Plus, Tag } from "lucide-react";
import { detailLines } from "@/core/nutrition/display";
import { groupByMoment, MOMENTS, type MomentBounds } from "@/core/nutrition/moments";
import type { ProgramSlot } from "@/core/nutrition/programs";
import { withSlots, type DayItem } from "@/core/nutrition/slots";
import { formatNumber } from "@/core/shared/format";
import { SlotLine } from "./SlotLine";
import type { DayView, LogEntryView } from "@/core/nutrition/repositories/log";
import type { ReactNode } from "react";
import { formatCents } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, macroLabels, type Messages } from "@/i18n";
import type { ActionButtonState } from "@/ui/ActionButtonForm";
import { FoodDetails } from "@/ui/FoodDetails";
import { OneOpen, OpenRow } from "@/ui/OneOpen";
import { MOMENT_BG, MOMENT_TEXT } from "@/ui/MomentIcon";
import { buttonClass } from "@/ui/button";
import { timeline, type TimelineSession } from "@/core/day/timeline";
import { TrashMenu } from "@/ui/TrashMenu";
import { timeIn } from "@/core/shared/dates";
import type { FormState } from "@/core/shared/result";
import {
  LiveEntryStrip,
  LiveGroupKcal,
  LiveCountToggle,
  LiveServings,
  LiveStatusToggle,
  LiveTimes,
} from "./LiveDay";
import { LinesEditor } from "./LinesEditor";
import { WhenEditor } from "./WhenEditor";
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
  /** In or out of the plan's total (a planned entry). */
  leftOutAction: (id: string, out: boolean) => Promise<{ ok: boolean; message?: string }>;
  statusAction: (
    id: string,
    status: "planned" | "eaten",
  ) => (prev: ActionButtonState, formData: FormData) => Promise<ActionButtonState>;
  /** Edit the time and moment, bound per entry (2026-10-10). */
  timeAction: (id: string) => (prev: FormState, formData: FormData) => Promise<FormState>;
  /** 2026-10-11: an entry's ingredients edited in place. */
  linesAction: (
    id: string,
  ) => (prev: FormState, formData: FormData) => Promise<FormState>;
  /** The −/+ multiplier of an entry (a plain form). */
  servingsAction: (id: string) => (formData: FormData) => Promise<void>;
  /**
   * What the entry is made of (NOVA, origin, fibre, tags, rating): the same
   * block as the meal cards, composed by the page (another slice's component).
   */
  quality?: (entry: LogEntryView) => ReactNode;
  /**
   * ADR-0044: the day type's slots and the day's targets. Matched groups
   * show their slot; empty slots show where they fall.
   */
  slots?: readonly ProgramSlot[];
  slotDay?: { kcal: number | null; protein: number | null; kg: number | null };
  /** ADR-0050: the day's training sessions, on the timeline. */
  sessions?: readonly TimelineSession[];
  /** Minutes after midnight on today (the "now" line); null on other days. */
  now?: number | null;
  /** A past day: every empty slot is past. */
  over?: boolean;
  t: Pick<
    Messages,
    | "dayProgram"
    | "day"
    | "nutrients"
    | "macro"
    | "errors"
    | "moments"
    | "actions"
    | "label"
    | "entryEdit"
    | "settings"
  >;
};
type GroupItem = Extract<DayItem<LogEntryView>, { type: "group" }>;

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
  leftOutAction,
  timeAction,
  linesAction,
  servingsAction,
  quality,
  slots = [],
  slotDay = { kcal: null, protein: null, kg: null },
  sessions = [],
  now = null,
  over = false,
  t,
}: Props) {
  if (day.entries.length === 0 && slots.length === 0 && sessions.length === 0)
    return <p className="text-muted">{t.day.empty}</p>;
  const labels = macroLabels(t);
  const items = withSlots(groupByMoment(day.entries, timeZone, bounds), slots, slotDay);
  /** A moment's group, with its slot when the program has one. */
  const renderGroup = ({ group, slot, eatenProtein }: GroupItem) => (
    <div id={`day-moment-${group.key}`} className="flex scroll-mt-24 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`font-semibold ${(group.moment && MOMENT_TEXT[group.moment]) || ""}`}
        >
          {group.part
            ? t.moments.snackParts[group.part]
            : group.moment
              ? t.moments.names[group.moment]
              : t.moments.none}
        </span>
        <span className="flex items-baseline gap-1 text-meta text-muted tabular-nums">
          <LiveGroupKcal
            ids={group.entries.map((e) => e.id)}
            locale={locale}
            text={t.moments.subtotal}
          />
          {slot?.target.kcal != null && (
            // Its own element: as bare text it ran into the live kcal ("kcalsu").
            <span>
              {fill(t.dayProgram.slotKcal, {
                kcal: formatNumber(String(slot.target.kcal), locale, 0),
              })}
            </span>
          )}
        </span>
      </div>
      {/* Eaten against the slot's share (ADR-0050): over by 5 % turns amber. */}
      {slot?.target.kcal != null && slot.target.kcal > 0 && (
        <span className="block h-1 rounded-badge bg-hairline" aria-hidden="true">
          <span
            className={`block h-1 rounded-badge ${
              Number(group.eatenKcal) > slot.target.kcal * 1.05 ? "bg-warn" : "bg-herb"
            }`}
            style={{
              width: `${Math.min(100, (Number(group.eatenKcal) / slot.target.kcal) * 100)}%`,
            }}
          />
        </span>
      )}
      {slot && (
        <SlotLine
          slot={slot}
          eatenProtein={eatenProtein}
          locale={locale}
          t={t.dayProgram}
        />
      )}
      {/* ADR-0050: compact rows, one open at a time, everything edited here. */}
      <ol className="flex flex-col gap-2">
        {group.entries.map((e) => (
          <li key={e.id} className={e.status === "planned" ? "item-planned" : ""}>
            <OpenRow
              id={e.id}
              label={fill(t.day.entryDetails, { name: e.label })}
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
              head={
                <span className="flex flex-col leading-tight">
                  <span
                    className={`font-semibold wrap-break-word ${
                      e.status === "planned" ? "text-muted" : ""
                    }`}
                  >
                    {e.estimated && <span aria-hidden="true">~</span>}
                    {e.label}
                  </span>
                  <span className="flex flex-wrap items-baseline gap-x-1.5 text-meta text-muted tabular-nums">
                    {e.at && <span>{timeIn(new Date(e.at), timeZone)}</span>}
                    {e.at && <span aria-hidden="true">{"·"}</span>}
                    <LiveGroupKcal
                      ids={[e.id]}
                      locale={locale}
                      text={t.moments.subtotal}
                    />
                    {e.estimated && <span aria-hidden="true">{"·"}</span>}
                    {e.estimated && <span>{t.day.estimated}</span>}
                  </span>
                </span>
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
              {/* 2026-10-10: time and moment edited here, not on a page. */}
              <WhenEditor
                action={timeAction(e.id)}
                time={e.at ? timeIn(new Date(e.at), timeZone) : ""}
                moment={e.moment ?? group.moment ?? "snack"}
                moments={MOMENTS}
                t={t}
              />
              {quality?.(e)}
              {e.estimated || e.batchId ? (
                <FoodDetails
                  summary={
                    e.lines.length > 1
                      ? fill(t.macro.ingredientsCount, { n: String(e.lines.length) })
                      : t.day.details
                  }
                  lines={detailLines(e.lines, e.servings, locale)}
                  labels={labels}
                />
              ) : (
                <LinesEditor
                  action={linesAction(e.id)}
                  servings={e.servings}
                  lines={e.lines}
                  t={t}
                />
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-3">
                  <LiveCountToggle
                    id={e.id}
                    action={leftOutAction}
                    labels={{ counted: t.day.inTotal, leftOut: t.day.outOfTotal }}
                  />
                  <LiveTimes id={e.id} locale={locale} t={t.day} />
                  {/* Cost as on the meal cards; nothing when no price is known. */}
                  {e.totals.costCents > 0 && (
                    <span className="inline-flex items-center gap-1 text-meta text-price">
                      <Tag size={14} aria-hidden="true" />
                      {e.totals.costComplete
                        ? formatCents(e.totals.costCents, locale)
                        : fill(t.label.costPartialShort, {
                            v: formatCents(e.totals.costCents, locale),
                          })}
                    </span>
                  )}
                </span>
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
                            // Back to this list (ui/ScrollMemory keeps the place).
                            href: `/log/${e.id}?from=${encodeURIComponent(`/?day=${e.day}&tab=food`)}`,
                          },
                        ]
                  }
                  actions={[
                    { label: t.day.refresh, run: refresh, done: t.day.refreshed },
                  ]}
                  labels={t.actions}
                />
              </div>
            </OpenRow>
          </li>
        ))}
      </ol>
    </div>
  );
  const rows = timeline(items, sessions, now, over);
  const hhmm = (m: number | null) =>
    m === null
      ? "—"
      : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const tl = t.dayProgram.timeline;
  return (
    // ADR-0050: the day as one timeline — time, a rail with a dot, the content.
    <OneOpen>
      <ol className="flex flex-col">
        {rows.map((row) => {
          const key =
            row.type === "group"
              ? row.item.group.key
              : row.type === "empty"
                ? row.item.key
                : row.type === "session"
                  ? `session-${row.session.id}`
                  : "now";
          if (row.type === "now")
            return (
              <li key={key} className="flex items-center gap-2 py-1 text-tomato">
                <span className="w-12 shrink-0 font-display font-bold tabular-nums">
                  {hhmm(row.at)}
                </span>
                <span className="flex w-3.5 shrink-0 justify-center" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-tomato" />
                </span>
                <span className="h-0.5 flex-1 bg-tomato" aria-hidden="true" />
                <span className="text-meta font-semibold">{tl.now}</span>
              </li>
            );
          const moment =
            row.type === "group"
              ? row.item.group.moment
              : row.type === "empty"
                ? row.item.moment
                : null;
          const dot =
            row.type === "session"
              ? "h-3 w-3 rounded-sm bg-ink"
              : row.type === "empty"
                ? `h-3 w-3 rounded-full rule-strong border-current bg-paper ${
                    row.past
                      ? "text-hairline"
                      : (moment && MOMENT_TEXT[moment]) || "text-muted"
                  }`
                : `h-3 w-3 rounded-full ${(moment && MOMENT_BG[moment]) || "bg-muted"}`;
          return (
            <li key={key} className="flex gap-2">
              <span
                className={`w-12 shrink-0 pt-3 font-display text-item font-bold tabular-nums ${
                  row.type === "empty" && row.past ? "text-muted" : ""
                }`}
              >
                {hhmm(row.at)}
              </span>
              <span
                className="flex w-3.5 shrink-0 flex-col items-center"
                aria-hidden="true"
              >
                <span className="h-4 w-0.5 bg-hairline" />
                <span className={dot} />
                <span className="w-0.5 flex-1 bg-hairline" />
              </span>
              <div className="min-w-0 flex-1 pt-2 pb-4">
                {row.type === "group" ? (
                  renderGroup(row.item)
                ) : row.type === "empty" ? (
                  <div
                    className={`flex items-start justify-between gap-2 ${row.past ? "text-muted" : ""}`}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span
                        className={`font-semibold ${row.past ? "" : (MOMENT_TEXT[row.item.moment] ?? "")}`}
                      >
                        {t.moments.names[row.item.moment]}
                        {row.past && ` · ${tl.skipped}`}
                      </span>
                      {!row.past && (
                        <SlotLine
                          slot={row.item.slot}
                          eatenProtein={null}
                          locale={locale}
                          t={t.dayProgram}
                        />
                      )}
                    </div>
                    <a
                      // ADR-0050: the sheet opens with this slot's moment and time.
                      href={`#day-add-food:moment=${row.item.moment}&time=${hhmm(row.at)}${
                        row.past ? "" : "&planned=1"
                      }`}
                      aria-label={fill(tl.addTo, {
                        slot: t.moments.names[row.item.moment],
                      })}
                      className={buttonClass({
                        variant: row.past ? "quiet" : "secondary",
                        size: "sm",
                      })}
                    >
                      <Plus size={16} aria-hidden="true" />
                      {!row.past && tl.add}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-surface bg-ink p-3 text-paper">
                    <span className="flex min-w-0 flex-col">
                      <span className="font-display text-item font-bold">
                        {row.session.label}
                      </span>
                      <span className="text-meta">
                        {row.session.status === "done"
                          ? tl.sessionDone
                          : tl.sessionPlanned}
                      </span>
                    </span>
                    <a
                      href={
                        row.session.status === "done"
                          ? `/training/${row.session.id}`
                          : `/training/${row.session.id}/live`
                      }
                      className="inline-flex min-h-11 items-center rounded-control bg-paper px-4 font-semibold text-ink"
                    >
                      {row.session.status === "done" ? tl.open : tl.gym}
                    </a>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </OneOpen>
  );
}
