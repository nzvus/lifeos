/**
 * features/supplements/CaffeineChart.tsx — caffeine per day over the
 * period of the other charts (ADR-0039, Food → Trends): a bar per day, the
 * 400 mg line (EFSA's day for healthy adults), days past it in the warning
 * colour; average, days over and creatine in the caption. Days without
 * caffeine stay empty. Same frame and axis as the sleep chart.
 */
import { Coffee } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { CAFFEINE } from "@/core/supplements/levels";
import type { SupplementsPeriod } from "@/core/supplements/period";
import { fill, type Messages } from "@/i18n";
import { ChartFrame, dayAxis, FIT } from "@/ui/ChartFrame";

const H = 100;
const BAR_AREA = 76;

export function CaffeineChart({
  days,
  p,
  locale,
  t,
}: {
  days: readonly string[];
  p: SupplementsPeriod;
  locale: Locale;
  t: Messages["supplements"];
}) {
  const scroll = days.length > FIT;
  const slot = scroll ? 14 : 40;
  const W = slot * days.length;
  const barW = slot * (scroll ? 0.7 : 0.6);
  const top = Math.max(CAFFEINE.dayLimitMg * 1.25, ...p.caffeineByDay.values());
  const y = (mg: number) => BAR_AREA - (Math.min(mg, top) / top) * BAR_AREA;
  const axis = dayAxis([...days], locale);
  const n = (v: number) => formatNumber(String(v), locale, 0);
  const summary =
    p.avgMg === null
      ? t.chartNone
      : fill(t.chartSummary, {
          avg: n(p.avgMg),
          over: String(p.daysOver),
          creatine: String(p.creatineDays),
          pct: String(Math.round(p.saturation * 100)),
        });
  return (
    <ChartFrame
      title={t.chartTitle}
      icon={<Coffee size={16} aria-hidden="true" />}
      summary={summary}
      scroll={scroll}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={scroll ? W : undefined}
        className={scroll ? "block" : "w-full"}
        role="img"
        aria-label={`${t.chartTitle} — ${summary}`}
      >
        <line x1={0} x2={W} y1={BAR_AREA} y2={BAR_AREA} className="stroke-hairline" />
        {/* EFSA's day for healthy adults. */}
        <line
          x1={0}
          x2={W}
          y1={y(CAFFEINE.dayLimitMg)}
          y2={y(CAFFEINE.dayLimitMg)}
          strokeDasharray="4 3"
          className="stroke-tomato"
        />
        {days.map((d, i) => {
          const mg = p.caffeineByDay.get(d);
          const text = axis(d);
          const tip = `${d}\n${mg === undefined ? t.chartNone : `${n(mg)} mg`}`;
          return (
            <Link key={d} href={`/?day=${d}`} aria-label={tip}>
              <title>{tip}</title>
              <rect
                x={i * slot}
                y={0}
                width={slot}
                height={H}
                className="fill-transparent"
              />
              {mg !== undefined && (
                <rect
                  x={i * slot + (slot - barW) / 2}
                  y={y(mg)}
                  width={barW}
                  height={Math.max(BAR_AREA - y(mg), 3)}
                  rx={2}
                  className={mg > CAFFEINE.dayLimitMg ? "fill-warn" : "fill-ink"}
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
