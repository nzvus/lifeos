/**
 * features/training/plan/MonthCalendar.tsx — the Plan tab's month
 * (ADR-0035): a grid of weeks, each day with its training as coloured
 * icons (filled = done, outlined = planned or from the program, a moon =
 * rest); below it the same days as an agenda, with names. Every day opens
 * its sheet (PlanDaySheet). Server component: links only.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Look } from "@/core/training/calendar";
import type { Messages } from "@/i18n";
import { Badge } from "@/ui/Badge";
import { buttonClass, TEXT_LINK } from "@/ui/button";
import { PlanChip, type PlanState } from "@/ui/PlanChip";

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
  /** "ven 3 ott", for the agenda and the cell's label. */
  label: string;
  inMonth: boolean;
  isToday: boolean;
  entries: PlanEntry[];
  /** The coming week: day type and targets, e.g. "Rec · 2 532 kcal · P 167". */
  note?: string;
};

const SAMPLE: Look = { region: "chest", pattern: "horizontal_press", cardio: false };
/** A day opens the Plan's day sheet (PlanDaySheet), which leads to the day. */
const href = (day: string) => `#plan-day:${day}`;

export function MonthCalendar({
  title,
  prevHref,
  nextHref,
  todayHref,
  weekdays,
  weeks,
  agendaFrom,
  t,
}: {
  title: string;
  prevHref: string;
  nextHref: string;
  /** Back to this month, when another one is shown. */
  todayHref: string | null;
  /** Narrow weekday names, Monday first. */
  weekdays: string[];
  weeks: PlanDayView[][];
  /** The agenda's first day, or null for the whole month. */
  agendaFrom: string | null;
  t: Messages["plan"];
}) {
  const agenda = weeks
    .flat()
    .filter(
      (d) =>
        d.inMonth &&
        (!agendaFrom || d.day >= agendaFrom) &&
        (d.entries.length > 0 || d.note),
    );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={prevHref}
          aria-label={t.prev}
          className={buttonClass({ variant: "quiet", iconOnly: true })}
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </Link>
        <div className="flex flex-col items-center">
          <h2 className="font-heading text-section font-bold first-letter:uppercase">
            {title}
          </h2>
          {todayHref && (
            <Link href={todayHref} className={`text-meta ${TEXT_LINK}`}>
              {t.thisMonth}
            </Link>
          )}
        </div>
        <Link
          href={nextHref}
          aria-label={t.next}
          className={buttonClass({ variant: "quiet", iconOnly: true })}
        >
          <ChevronRight size={24} aria-hidden="true" />
        </Link>
      </div>

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
              d.isToday ? "ring-2 ring-herb" : ""
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

      <section aria-label={t.agenda} className="flex flex-col gap-2">
        <h3 className="font-display text-item font-semibold">{t.agenda}</h3>
        {agenda.length === 0 ? (
          <p className="text-muted">{t.nothing}</p>
        ) : (
          <ul className="flex flex-col">
            {agenda.map((d) => (
              <li key={d.day}>
                <a
                  href={href(d.day)}
                  className={`flex items-start gap-3 rounded-control px-2 py-2 hover:bg-paper ${
                    d.isToday ? "bg-paper" : ""
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
                    {d.entries.map((e) => (
                      <span
                        key={e.key}
                        className="inline-flex min-w-0 items-center gap-1"
                      >
                        <PlanChip look={e.look} state={e.state} label={e.name} />
                        {e.late && <Badge tone="planned">{t.late}</Badge>}
                        {e.changed && <Badge>{t.changed}</Badge>}
                      </span>
                    ))}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
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
