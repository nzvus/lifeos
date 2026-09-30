/**
 * features/nutrition/trends/RangeNav.tsx — which days the charts show: a
 * period (7 / 30 / 90 days) and arrows to move it back and forth. All in the
 * URL (/profiles?range=30&to=2026-09-30), like the day page: every view has
 * an address, back/forward work. Server component: links only.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { TREND_RANGES, type TrendRange } from "@/core/nutrition/preferences";
import { addDays } from "@/core/shared/dates";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";

type Props = {
  range: TrendRange;
  from: string;
  to: string;
  today: string;
  locale: Locale;
  t: Messages["trends"];
};

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };

export function RangeNav({ range, from, to, today, locale, t }: Props) {
  const href = (r: number, end: string) =>
    end === today ? `/profiles?range=${r}` : `/profiles?range=${r}&to=${end}`;
  const date = new Intl.DateTimeFormat(INTL[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const later = addDays(to, range) > today ? today : addDays(to, range);
  return (
    <div className="flex flex-col gap-2">
      <nav aria-label={t.ranges} className="flex gap-1">
        {TREND_RANGES.map((r) => (
          <Link
            key={r}
            href={href(r, to)}
            aria-current={r === range ? "page" : undefined}
            className={`flex-1 rounded-control px-2 py-1.5 text-center font-display text-item ${
              r === range
                ? "rule-b-heavy border-ink bg-sheet font-bold"
                : "rule-b-medium border-hairline text-muted hover:text-ink"
            }`}
          >
            {fill(t.days, { n: String(r) })}
          </Link>
        ))}
      </nav>
      <div className="flex items-center justify-between gap-2 text-meta">
        <Link
          href={href(range, addDays(to, -range))}
          aria-label={t.earlier}
          className="p-1"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <span className="font-display tabular-nums">
          {fill(t.span, {
            from: date.format(new Date(`${from}T12:00:00Z`)),
            to: date.format(new Date(`${to}T12:00:00Z`)),
          })}
        </span>
        {to < today ? (
          <span className="flex items-center gap-2">
            <Link href={href(range, today)} className="underline">
              {t.latest}
            </Link>
            <Link href={href(range, later)} aria-label={t.later} className="p-1">
              <ChevronRight size={20} aria-hidden="true" />
            </Link>
          </span>
        ) : (
          <span className="w-7" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
