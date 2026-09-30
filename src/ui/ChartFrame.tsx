/**
 * ui/ChartFrame.tsx — what every day-by-day chart shares (nutrition trends,
 * grouped macros, training): the caption row (title left, summary right), the day axis labels,
 * and the sideways scroll for long periods (starting at the latest day).
 *
 * Up to a week the chart fits the width; longer ranges keep readable bars
 * and scroll (dir="rtl" on the scroller, so no script is needed to start at
 * the right end).
 */
import type { ReactNode } from "react";

/** Up to this many days, a chart fits the width; beyond, it scrolls. */
export const FIT = 7;

const INTL: Record<string, string> = { it: "it-IT", en: "en-GB" };

/** Axis label per day: weekdays for a week; for longer ranges, a few dates. */
export function dayAxis(days: readonly string[], locale: string) {
  const scroll = days.length > FIT;
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(INTL[locale] ?? locale, { ...o, timeZone: "UTC" });
  const weekday = fmt({ weekday: "narrow" });
  const month = fmt({ month: "short" });
  return (d: string): string | null => {
    const date = new Date(`${d}T12:00:00Z`);
    if (!scroll) return weekday.format(date);
    const dom = date.getUTCDate();
    if (dom === 1) return month.format(date);
    if (days.length <= 31 ? dom % 5 === 0 : dom === 15) return String(dom);
    return null;
  };
}

export function ChartFrame({
  title,
  icon,
  summary,
  scroll,
  children,
  footer,
}: {
  title: string;
  icon?: ReactNode;
  /** Already filled in, e.g. "average 1 850 kcal". */
  summary?: string;
  scroll: boolean;
  /** The chart itself (an <svg>). */
  children: ReactNode;
  /** Under the chart: a legend, averages. */
  footer?: ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex items-baseline justify-between gap-2 text-meta">
        <span className="flex items-center gap-1.5 font-semibold">
          {icon}
          {title}
        </span>
        {summary && (
          <span className="font-display text-muted tabular-nums">{summary}</span>
        )}
      </figcaption>
      {scroll ? (
        // rtl: the scroller starts at its right end (the latest day); the
        // chart inside is laid out left to right as usual.
        <div dir="rtl" className="overflow-x-auto">
          <div dir="ltr" className="w-max">
            {children}
          </div>
        </div>
      ) : (
        children
      )}
      {footer}
    </figure>
  );
}
