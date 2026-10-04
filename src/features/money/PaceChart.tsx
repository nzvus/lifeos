/**
 * features/money/PaceChart.tsx — how the month's spending builds up, day by
 * day, against last month (ADR-0036; the banking-app "spending pace"). One
 * axis (euros); this month a solid ink line, last month a dashed muted one,
 * both named at their end. Moving a finger or the pointer over the chart
 * shows that day's two numbers under it. Plain SVG, theme tokens. Client
 * component (the hover).
 */
"use client";

import { TrendingUp } from "lucide-react";
import { useState } from "react";
import { formatCents } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ChartFrame } from "@/ui/ChartFrame";

const W = 340;
const H = 160;
const PAD = { l: 44, r: 8, t: 10, b: 20 };

export function PaceChart({
  cumulative,
  lastCumulative,
  daysInMonth,
  monthLabel,
  lastLabel,
  locale,
  t,
}: {
  /** This month, cents, index 0 = the 1st, up to today. */
  cumulative: number[];
  /** Last month, whole. */
  lastCumulative: number[];
  daysInMonth: number;
  /** "ottobre", "settembre": the lines' names. */
  monthLabel: string;
  lastLabel: string;
  locale: Locale;
  t: Messages["money"];
}) {
  const [at, setAt] = useState<number | null>(null);
  const days = Math.max(daysInMonth, lastCumulative.length);
  const max = Math.max(100, ...cumulative, ...lastCumulative);
  // A round top: 1, 2 or 5 × a power of ten, in euros.
  const top = (() => {
    const e = max / 100;
    const p = 10 ** Math.floor(Math.log10(e));
    const step = [1, 2, 5, 10].find((k) => k * p >= e)! * p;
    return step * 100;
  })();
  const x = (i: number) => PAD.l + (i / Math.max(1, days - 1)) * (W - PAD.l - PAD.r);
  const y = (c: number) => PAD.t + (1 - c / top) * (H - PAD.t - PAD.b);
  const path = (v: number[]) =>
    v.map((c, i) => `${i ? "L" : "M"}${x(i)},${y(c)}`).join(" ");
  const euros = (c: number) => formatCents(c, locale);
  const short = (c: number) => `${Math.round(c / 100)} €`;
  const pick = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const sx = ((clientX - r.left) / r.width) * W;
    const i = Math.round(((sx - PAD.l) / (W - PAD.l - PAD.r)) * (days - 1));
    setAt(Math.min(days - 1, Math.max(0, i)));
  };
  const hover = at === null ? cumulative.length - 1 : at;
  const now = cumulative[hover];
  const then = lastCumulative[hover];
  return (
    <ChartFrame
      title={t.paceCaption}
      icon={<TrendingUp size={16} aria-hidden="true" />}
      scroll={false}
      footer={
        <p className="flex flex-wrap gap-x-4 text-meta tabular-nums" aria-live="polite">
          <span className="font-semibold">
            {fill(t.paceDay, { day: String(hover + 1) })}
          </span>
          <span>{`${monthLabel}: ${now === undefined ? "—" : euros(now)}`}</span>
          <span className="text-muted">
            {`${lastLabel}: ${then === undefined ? "—" : euros(then)}`}
          </span>
        </p>
      }
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-pan-y"
        role="img"
        aria-label={fill(t.paceLabel, {
          now: now === undefined ? "—" : euros(now),
          then: then === undefined ? "—" : euros(then),
        })}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
        onPointerLeave={() => setAt(null)}
      >
        {[0, top / 2, top].map((k) => (
          <g key={k}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(k)}
              y2={y(k)}
              className="stroke-hairline"
            />
            <text
              x={PAD.l - 4}
              y={y(k) + 4}
              textAnchor="end"
              className="fill-muted text-meta"
            >
              {short(k)}
            </text>
          </g>
        ))}
        <text x={PAD.l} y={H - 4} className="fill-muted text-meta">
          {1}
        </text>
        <text x={W - PAD.r} y={H - 4} textAnchor="end" className="fill-muted text-meta">
          {days}
        </text>
        {lastCumulative.length > 0 && (
          <path
            d={path(lastCumulative)}
            fill="none"
            strokeWidth={2}
            strokeDasharray="4 3"
            className="stroke-muted"
          />
        )}
        {cumulative.length > 0 && (
          <path d={path(cumulative)} fill="none" strokeWidth={2} className="stroke-ink" />
        )}
        <line
          x1={x(hover)}
          x2={x(hover)}
          y1={PAD.t}
          y2={H - PAD.b}
          className="stroke-hairline"
        />
        {now !== undefined && (
          <circle
            cx={x(hover)}
            cy={y(now)}
            r={4}
            className="fill-ink stroke-sheet"
            strokeWidth={2}
          />
        )}
        {then !== undefined && (
          <circle
            cx={x(hover)}
            cy={y(then)}
            r={4}
            className="fill-muted stroke-sheet"
            strokeWidth={2}
          />
        )}
      </svg>
    </ChartFrame>
  );
}
