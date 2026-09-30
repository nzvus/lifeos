/**
 * features/training/progress/TrainingChart.tsx — training per day over the
 * same period as the nutrition charts (Targets page): a bar per day for the
 * tonnage lifted, the estimated burn in each day's tooltip, and the period's
 * totals in the caption. Data: core/training/analysis.ts trainingByDay.
 */
import { Dumbbell } from "lucide-react";
import Link from "next/link";
import type { TrainingDay } from "@/core/training/analysis";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ChartFrame, dayAxis, FIT } from "@/ui/ChartFrame";

const H = 100;
const BAR_AREA = 76;

export function TrainingChart({
  days,
  locale,
  t,
}: {
  days: readonly TrainingDay[];
  locale: Locale;
  t: Messages["training"];
}) {
  const scroll = days.length > FIT;
  const slot = scroll ? 14 : 40;
  const W = slot * days.length;
  const barW = slot * (scroll ? 0.7 : 0.6);
  const max = Math.max(1, ...days.map((d) => d.tonnage));
  const axis = dayAxis(
    days.map((d) => d.day),
    locale,
  );
  const n = (v: number) => formatNumber(String(v), locale, 0);
  const sessions = days.reduce((a, d) => a + d.sessions, 0);
  const tonnage = days.reduce((a, d) => a + d.tonnage, 0);
  const burns = days.flatMap((d) => (d.burn ? [d.burn] : []));
  const summary = [
    fill(t.chart.sessions, { n: String(sessions) }),
    fill(t.chart.tonnage, { v: n(tonnage) }),
    ...(burns.length
      ? [
          fill(t.chart.burn, {
            low: n(burns.reduce((a, b) => a + b.low, 0)),
            high: n(burns.reduce((a, b) => a + b.high, 0)),
          }),
        ]
      : []),
  ].join(" · ");

  return (
    <ChartFrame
      title={t.chart.title}
      icon={<Dumbbell size={16} aria-hidden="true" />}
      summary={summary}
      scroll={scroll}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={scroll ? W : undefined}
        className={scroll ? "block" : "w-full"}
        role="img"
        aria-label={`${t.chart.title} — ${t.chart.label}`}
      >
        <line x1={0} x2={W} y1={BAR_AREA} y2={BAR_AREA} className="stroke-hairline" />
        {days.map((d, i) => {
          const h = (d.tonnage / max) * BAR_AREA;
          const x = i * slot + (slot - barW) / 2;
          const text = axis(d.day);
          const tip = [
            d.day,
            d.sessions ? fill(t.chart.tonnage, { v: n(d.tonnage) }) : t.chart.rest,
            ...(d.burn
              ? [fill(t.chart.burn, { low: n(d.burn.low), high: n(d.burn.high) })]
              : []),
          ].join("\n");
          return (
            <Link key={d.day} href={`/?day=${d.day}`} aria-label={tip}>
              <title>{tip}</title>
              <rect
                x={i * slot}
                y={0}
                width={slot}
                height={H}
                className="fill-transparent"
              />
              {d.sessions > 0 && (
                <rect
                  x={x}
                  y={BAR_AREA - h}
                  width={barW}
                  height={Math.max(h, 3)}
                  rx={2}
                  className="fill-herb"
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
