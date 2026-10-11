/**
 * features/nutrition/log/WeekStrip.tsx — the week of the shown day, Monday
 * to Sunday, to move between days: each day with its weekday, its date, a
 * thin bar of the energy eaten against its target coloured by state like
 * the day panel's Energy row (core/nutrition/bands bandState), and the
 * difference from the target in kcal ("−340", "+120") on days that have
 * come. A number, not a hover box: phones have no hover.
 *
 * Weeks (2026-10-11: "an easier way to scroll the weeks, more responsive"):
 * "‹ 5 – 11 Oct ›" above the days, or a swipe across them, goes to the same
 * weekday a week before or after. A tapped day is marked at once while the
 * page loads (DayGo). Charts over longer ranges live on the Targets page.
 *
 * Client component (the swipe and the instant mark); links stay real links.
 */
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { bandFor, bandState } from "@/core/nutrition/bands";
import type { DaySummary } from "@/core/nutrition/repositories/history";
import { TARGET_KIND } from "@/core/nutrition/targets";
import { addDays } from "@/core/shared/dates";
import type { Locale } from "@/core/shared/locales";
import { fill as format, type Messages } from "@/i18n";
import { buttonClass } from "@/ui/button";
import { STATE_FILL } from "@/ui/NutrientRow";
import { useDayGo } from "./DayGo";

type Props = {
  week: DaySummary[]; // Monday … Sunday
  day: string;
  today: string;
  locale: Locale;
  t: Pick<Messages["day"], "weekBalance" | "previousWeek" | "nextWeek">;
};

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

/**
 * "5 – 11 Oct", "28 Sep – 4 Oct": built by hand, because formatRange's
 * spaces differ between the server and the browser (a hydration error).
 */
function weekRange(first: string, last: string, dayMonth: Intl.DateTimeFormat): string {
  const at = (d: string) => new Date(`${d}T12:00:00Z`);
  const from =
    first.slice(0, 7) === last.slice(0, 7)
      ? String(Number(first.slice(8)))
      : dayMonth.format(at(first));
  return `${from} – ${dayMonth.format(at(last))}`;
}
/** A horizontal swipe longer than this (px), and mostly sideways, turns the week. */
const SWIPE_PX = 50;

export function WeekStrip({ week, day, today, locale, t }: Props) {
  const { target, pending, go, href } = useDayGo();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const weekday = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "short",
    timeZone: "UTC",
  });
  const range = new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const signed = new Intl.NumberFormat(INTL[locale], { signDisplay: "exceptZero" });
  const first = week[0]?.day ?? day;
  const last = week.at(-1)?.day ?? day;
  const turn = (by: -7 | 7) => go(addDays(day, by));
  const arrow = (by: -7 | 7) => (
    <a
      href={href(addDays(day, by))}
      onClick={(e) => {
        e.preventDefault();
        turn(by);
      }}
      aria-label={by < 0 ? t.previousWeek : t.nextWeek}
      className={buttonClass({ variant: "quiet", size: "sm", iconOnly: true })}
    >
      {by < 0 ? (
        <ChevronLeft size={18} aria-hidden="true" />
      ) : (
        <ChevronRight size={18} aria-hidden="true" />
      )}
    </a>
  );
  return (
    <div
      className="flex flex-col gap-1"
      onTouchStart={(e) => {
        const p = e.touches[0]!;
        touch.current = { x: p.clientX, y: p.clientY };
      }}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        const p = e.changedTouches[0];
        if (!s || !p) return;
        const dx = p.clientX - s.x;
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > 2 * Math.abs(p.clientY - s.y))
          turn(dx < 0 ? 7 : -7);
      }}
    >
      <div className="flex items-center justify-between">
        {arrow(-7)}
        <span className="text-meta text-muted tabular-nums">
          {weekRange(first, last, range)}
        </span>
        {arrow(7)}
      </div>
      <ol className={`grid grid-cols-7 gap-1 ${pending ? "opacity-70" : ""}`}>
        {week.map((d) => {
          const kcal = Number(d.totals.nutrients.kcal);
          const goal = d.targets?.kcal ? Number(d.targets.kcal) : null;
          const state = bandState(kcal, bandFor(undefined, goal, TARGET_KIND.kcal));
          const fill = goal ? Math.min(1, kcal / goal) : d.logged ? 1 : 0;
          // The difference only once the day has come and something is logged.
          const delta =
            goal && d.logged && d.day <= today ? Math.round(kcal - goal) : null;
          const selected = d.day === target;
          const date = new Date(`${d.day}T12:00:00Z`);
          return (
            <li key={d.day}>
              <a
                href={href(d.day)}
                onClick={(e) => {
                  e.preventDefault();
                  go(d.day);
                }}
                title={
                  delta === null
                    ? undefined
                    : format(t.weekBalance, {
                        kcal: String(Math.round(kcal)),
                        target: String(Math.round(goal!)),
                        delta: signed.format(delta),
                      })
                }
                aria-current={d.day === day ? "date" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-control px-1 py-1.5 transition-colors ${
                  selected
                    ? "rule-medium border-ink bg-sheet"
                    : "border border-transparent hover:bg-sheet"
                }`}
              >
                <span className="text-meta text-muted first-letter:uppercase">
                  {weekday.format(date)}
                </span>
                <span
                  className={`font-display text-item tabular-nums ${d.day === today ? "font-bold text-herb" : ""}`}
                >
                  {date.getUTCDate()}
                </span>
                <span
                  className="h-1 w-full overflow-hidden bg-hairline"
                  aria-hidden="true"
                >
                  <span
                    className={`block h-full ${STATE_FILL[state]}`}
                    style={{ width: `${fill * 100}%` }}
                  />
                </span>
                <span className="text-meta leading-none tabular-nums text-muted">
                  {delta === null ? " " : signed.format(delta)}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
