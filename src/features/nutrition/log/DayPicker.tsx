/**
 * features/nutrition/log/DayPicker.tsx — the calendar next to the day's
 * title (2026-10-11: the browser's own date picker looked foreign and bare).
 * The button opens a sheet (#day-calendar) with the month as a grid, Monday
 * first: the shown day marked, today in green, arrows for the months, and
 * "Today". A day goes there through DayGo, so it is marked at once.
 * Client component.
 */
"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { addDays } from "@/core/shared/dates";
import type { Locale } from "@/core/shared/locales";
import type { Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { Sheet } from "@/ui/Sheet";
import { useDayGo } from "./DayGo";

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };
const SHEET = "day-calendar";

type T = Pick<
  Messages["day"],
  "calendar" | "previousMonth" | "nextMonth" | "today" | "goTo"
> & { close: string };

/** The button, in the day's title row. */
export function DayPicker({ label }: { label: string }) {
  return (
    <a
      href={`#${SHEET}`}
      aria-label={label}
      title={label}
      className={buttonClass({ variant: "quiet", iconOnly: true })}
    >
      <CalendarDays size={20} aria-hidden="true" />
    </a>
  );
}

/** "YYYY-MM" of a day, and the month after / before one. */
const monthOf = (day: string) => day.slice(0, 7);
const shiftMonth = (m: string, by: number) => {
  const [y, mo] = m.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, mo - 1 + by, 1));
  return d.toISOString().slice(0, 7);
};

/** The sheet, once on the page. */
export function CalendarSheet({
  day,
  today,
  locale,
  t,
}: {
  day: string;
  today: string;
  locale: Locale;
  t: T;
}) {
  const { target, go } = useDayGo();
  const [month, setMonth] = useState(monthOf(day));
  // The first Monday on or before the 1st, then six weeks: every month fits.
  const firstOfMonth = `${month}-01`;
  const weekdayOfFirst = (new Date(`${firstOfMonth}T12:00:00Z`).getUTCDay() + 6) % 7;
  const start = addDays(firstOfMonth, -weekdayOfFirst);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const weeks = days.at(35)!.startsWith(month) ? 6 : 5;
  const title = new Intl.DateTimeFormat(INTL[locale], {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${firstOfMonth}T12:00:00Z`));
  const weekday = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "narrow",
    timeZone: "UTC",
  });
  const pickDay = (d: string) => {
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    go(d);
  };
  return (
    <Sheet
      id={SHEET}
      title={t.calendar}
      icon={<CalendarDays size={20} aria-hidden="true" />}
      closeLabel={t.close}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label={t.previousMonth}
            className={buttonClass({ variant: "quiet", iconOnly: true })}
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <span className="font-heading text-item font-bold first-letter:uppercase">
            {title}
          </span>
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label={t.nextMonth}
            className={buttonClass({ variant: "quiet", iconOnly: true })}
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
        <div
          className="grid grid-cols-7 gap-1 text-center"
          role="grid"
          aria-label={title}
        >
          {days.slice(0, 7).map((d) => (
            <span key={`h-${d}`} className="text-meta text-muted" aria-hidden="true">
              {weekday.format(new Date(`${d}T12:00:00Z`))}
            </span>
          ))}
          {days.slice(0, weeks * 7).map((d) => {
            const inMonth = d.startsWith(month);
            const shown = d === target;
            const isToday = d === today;
            return (
              <button
                key={d}
                type="button"
                onClick={() => pickDay(d)}
                aria-label={new Intl.DateTimeFormat(INTL[locale], {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                }).format(new Date(`${d}T12:00:00Z`))}
                aria-current={shown ? "date" : undefined}
                className={`flex aspect-square min-h-11 items-center justify-center rounded-control font-display text-item tabular-nums ${
                  shown
                    ? "bg-ink font-bold text-paper"
                    : isToday
                      ? "rule-medium border-herb font-bold text-herb"
                      : inMonth
                        ? "hover:bg-paper"
                        : "text-muted opacity-60 hover:bg-paper"
                }`}
              >
                {Number(d.slice(8))}
              </button>
            );
          })}
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setMonth(monthOf(today));
              pickDay(today);
            }}
            className={buttonClass({ variant: "secondary", size: "sm" })}
          >
            {t.today}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
