/**
 * features/training/plan/PlanCalendar.tsx — the Plan (ADR-0035, ADR-0036):
 * one calendar, a week or a month at a time, swiped sideways (or the
 * arrows). A week lists each day with its training by name; a month is a
 * grid of coloured icons (filled = done, outlined = planned or from the
 * program, a moon = rest). Every day opens its sheet (PlanDaySheet).
 * The panels around the shown one come rendered; past the last one, the
 * arrow loads the page around a new day. Client component.
 */
"use client";

import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Look, PlanView } from "@/core/training/calendar";
import type { Messages } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { buttonClass, TEXT_LINK } from "@/ui/button";
import { PlanChip, type PlanState } from "@/ui/PlanChip";
import { SubNav } from "@/ui/SubNav";

export type PlanEntry = {
  key: string;
  name: string;
  look: Look;
  state: PlanState;
  late?: boolean;
  changed?: boolean;
};
export type PlanDayView = {
  day: string;
  /** "ven 3 ott", for the week's rows and the cell's label. */
  label: string;
  /** In the panel's month (a month's grid also shows its edges). */
  inMonth: boolean;
  isToday: boolean;
  entries: PlanEntry[];
  /** The coming week: day type and targets, e.g. "Rec · 2 532 kcal · P 167". */
  note?: string;
};
export type PlanPanel = { key: string; title: string; weeks: PlanDayView[][] };

const SAMPLE: Look = { region: "chest", pattern: "horizontal_press", cardio: false };
/** A day opens the Plan's day sheet (PlanDaySheet), which leads to the day. */
const href = (day: string) => `#plan-day:${day}`;

export function PlanCalendar({
  view,
  viewHrefs,
  panels,
  at,
  todayAt,
  todayHref,
  earlierHref,
  laterHref,
  weekdays,
  t,
}: {
  view: PlanView;
  viewHrefs: Record<PlanView, string>;
  panels: PlanPanel[];
  /** The panel shown first. */
  at: number;
  /** The panel with today, or null when today is not among them. */
  todayAt: number | null;
  todayHref: string;
  /** The page around the day before the first panel / after the last. */
  earlierHref: string;
  laterHref: string;
  /** Narrow weekday names, Monday first. */
  weekdays: string[];
  t: Messages["plan"];
}) {
  const row = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(at);
  // Start on the asked panel, without an animation.
  useEffect(() => {
    const el = row.current;
    if (el) el.scrollLeft = at * el.clientWidth;
  }, [at, view]);
  const go = (i: number) => {
    const el = row.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = row.current;
    if (el) setShown(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  };
  const first = shown <= 0;
  const last = shown >= panels.length - 1;
  const arrow = buttonClass({ variant: "quiet", iconOnly: true });
  const prevLabel = view === "week" ? t.prevWeek : t.prev;
  const nextLabel = view === "week" ? t.nextWeek : t.next;
  return (
    <div className="flex flex-col gap-3">
      <SubNav
        label={t.calendar}
        current={view}
        items={[
          {
            key: "week",
            href: viewHrefs.week,
            label: t.week,
            icon: <CalendarRange size={16} aria-hidden="true" />,
          },
          {
            key: "month",
            href: viewHrefs.month,
            label: t.month,
            icon: <CalendarDays size={16} aria-hidden="true" />,
          },
        ]}
      />
      <div className="flex items-center justify-between gap-2">
        {first ? (
          <Link href={earlierHref} aria-label={prevLabel} className={arrow}>
            <ChevronLeft size={24} aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label={prevLabel}
            onClick={() => go(shown - 1)}
            className={arrow}
          >
            <ChevronLeft size={24} aria-hidden="true" />
          </button>
        )}
        <div className="flex flex-col items-center">
          <h2
            className="font-heading text-section font-bold first-letter:uppercase"
            aria-live="polite"
          >
            {panels[shown]?.title}
          </h2>
          {shown !== todayAt &&
            (todayAt === null ? (
              <Link href={todayHref} className={`text-meta ${TEXT_LINK}`}>
                {t.backToToday}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => go(todayAt)}
                className={`text-meta ${TEXT_LINK}`}
              >
                {t.backToToday}
              </button>
            ))}
        </div>
        {last ? (
          <Link href={laterHref} aria-label={nextLabel} className={arrow}>
            <ChevronRight size={24} aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label={nextLabel}
            onClick={() => go(shown + 1)}
            className={arrow}
          >
            <ChevronRight size={24} aria-hidden="true" />
          </button>
        )}
      </div>

      <div ref={row} onScroll={onScroll} className="snap-row">
        {panels.map((p, i) => (
          <section
            key={p.key}
            aria-label={p.title}
            aria-hidden={i !== shown}
            className="w-full shrink-0 snap-start"
          >
            {view === "week" ? (
              <WeekPanel days={p.weeks[0] ?? []} t={t} />
            ) : (
              <MonthPanel weeks={p.weeks} weekdays={weekdays} />
            )}
          </section>
        ))}
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-muted">
        <span className="inline-flex items-center gap-1">
          <PlanChip look={SAMPLE} state="done" size={14} />
          {t.legendDone}
        </span>
        <span className="inline-flex items-center gap-1">
          <PlanChip look={SAMPLE} state="program" size={14} />
          {t.legendPlanned}
        </span>
        <span className="inline-flex items-center gap-1">
          <PlanChip look={SAMPLE} state="rest" size={14} />
          {t.legendRest}
        </span>
      </p>
    </div>
  );
}

/** A week: one row per day, its training by name, its day type and targets. */
function WeekPanel({ days, t }: { days: PlanDayView[]; t: Messages["plan"] }) {
  return (
    <ul className="flex flex-col">
      {days.map((d) => (
        <li key={d.day}>
          <a
            href={href(d.day)}
            className={`flex min-h-14 items-start gap-3 rounded-control px-2 py-2 hover:bg-paper ${
              d.isToday ? "bg-paper ring-2 ring-herb ring-inset" : ""
            }`}
          >
            <span className="flex w-24 shrink-0 flex-col text-meta">
              <span
                className={`first-letter:uppercase ${d.isToday ? "font-bold text-herb" : "text-muted"}`}
              >
                {d.label}
              </span>
              {d.note && <span className="text-muted tabular-nums">{d.note}</span>}
            </span>
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-meta">
              {d.entries.length === 0 ? (
                <span className="text-muted">{t.free}</span>
              ) : (
                d.entries.map((e) => (
                  <span key={e.key} className="inline-flex min-w-0 items-center gap-1">
                    <PlanChip look={e.look} state={e.state} label={e.name} />
                    {e.late && <Badge tone="planned">{t.late}</Badge>}
                    {e.changed && <Badge>{t.changed}</Badge>}
                  </span>
                ))
              )}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** A month: the grid of weeks, each day with up to three icons. */
function MonthPanel({ weeks, weekdays }: { weeks: PlanDayView[][]; weekdays: string[] }) {
  return (
    <div className="grid grid-cols-7 gap-1 text-center text-meta">
      {weekdays.map((w, i) => (
        <span key={i} className="font-semibold text-muted" aria-hidden="true">
          {w}
        </span>
      ))}
      {weeks.flat().map((d) => (
        <a
          key={d.day}
          href={href(d.day)}
          aria-label={[d.label, ...d.entries.map((e) => e.name)].join(", ")}
          className={`flex min-h-16 min-w-0 flex-col items-center gap-1 rounded-control p-1 hover:bg-paper ${
            d.isToday ? "ring-2 ring-herb ring-inset" : ""
          } ${d.inMonth ? "" : "opacity-40"}`}
        >
          <span
            className={`font-display tabular-nums ${d.isToday ? "font-bold text-herb" : ""}`}
          >
            {Number(d.day.slice(8))}
          </span>
          <span className="flex flex-wrap justify-center gap-0.5">
            {d.entries.slice(0, 3).map((e) => (
              <PlanChip key={e.key} look={e.look} state={e.state} size={14} />
            ))}
          </span>
        </a>
      ))}
    </div>
  );
}
