/**
 * features/training/body/SleepChart.tsx — hours slept per night over the
 * period of the other charts (ADR-0031, Progress → Trends): a bar per
 * wake-up day, the 7–9 h band shaded, nights under 6 h in the warning
 * colour; the average in the caption. Days without a night logged stay
 * empty (not zero). Same frame and axis as the training chart.
 */
import { Moon } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { SHORT_NIGHT_H } from "@/core/training/sleep";
import { fill, type Messages } from "@/i18n";
import { ChartFrame, dayAxis, FIT } from "@/ui/ChartFrame";

const H = 100;
const BAR_AREA = 76;
const TOP = 12; // hours at the top of the scale

export function SleepChart({
  days,
  hours,
  locale,
  t,
}: {
  /** The period's days, oldest first. */
  days: readonly string[];
  /** Hours slept by wake-up day. */
  hours: ReadonlyMap<string, number>;
  locale: Locale;
  t: Pick<Messages, "sleep">;
}) {
  const s = t.sleep;
  const scroll = days.length > FIT;
  const slot = scroll ? 14 : 40;
  const W = slot * days.length;
  const barW = slot * (scroll ? 0.7 : 0.6);
  const y = (h: number) => BAR_AREA - (Math.min(h, TOP) / TOP) * BAR_AREA;
  const axis = dayAxis([...days], locale);
  const logged = days.flatMap((d) => (hours.has(d) ? [hours.get(d)!] : []));
  const avg = logged.length ? logged.reduce((a, h) => a + h, 0) / logged.length : null;
  const summary =
    avg === null
      ? s.chartNone
      : fill(s.chartSummary, {
          avg: formatNumber(String(Math.round(avg * 10) / 10), locale, 1),
          n: String(logged.length),
        });
  return (
    <ChartFrame
      title={s.title}
      icon={<Moon size={16} aria-hidden="true" />}
      summary={summary}
      scroll={scroll}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={scroll ? W : undefined}
        className={scroll ? "block" : "w-full"}
        role="img"
        aria-label={`${s.title} — ${s.chartLabel}`}
      >
        {/* The good range, 7–9 h (AASM / NSF). */}
        <rect
          x={0}
          y={y(9)}
          width={W}
          height={y(7) - y(9)}
          className="fill-herb opacity-10"
        />
        <line x1={0} x2={W} y1={BAR_AREA} y2={BAR_AREA} className="stroke-hairline" />
        {days.map((d, i) => {
          const h = hours.get(d);
          const text = axis(d);
          const tip = `${d}\n${h === undefined ? s.none : fill(s.hours, { h: formatNumber(String(h), locale, 1) })}`;
          return (
            <Link key={d} href={`/?day=${d}#day-sleep`} aria-label={tip}>
              <title>{tip}</title>
              <rect
                x={i * slot}
                y={0}
                width={slot}
                height={H}
                className="fill-transparent"
              />
              {h !== undefined && (
                <rect
                  x={i * slot + (slot - barW) / 2}
                  y={y(h)}
                  width={barW}
                  height={Math.max(BAR_AREA - y(h), 3)}
                  rx={2}
                  className={h < SHORT_NIGHT_H ? "fill-warn" : "fill-herb"}
                />
              )}
              {text && (
                <text
                  x={i * slot + slot / 2}
                  y={H - 6}
                  textAnchor="middle"
                  className="fill-muted text-meta"
                >
                  {text}
                </text>
              )}
            </Link>
          );
        })}
      </svg>
    </ChartFrame>
  );
}
