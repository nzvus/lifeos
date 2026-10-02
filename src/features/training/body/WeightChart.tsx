/**
 * features/training/body/WeightChart.tsx — weight over time (Progress →
 * Weight, ADR-0027): each weigh-in a dot, fainter when it counts less (its
 * reliability), and the smoothed trend as a line; on top, the trend now and
 * its change over 7 and 30 days, and the weekly rate. The x axis is real
 * time (days between weigh-ins keep their length). Plain SVG, theme tokens.
 */
import { Scale } from "lucide-react";
import type { WeighInView } from "@/core/energy/repositories/energy";
import { addDays } from "@/core/shared/dates";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { fill, type Messages } from "@/i18n";
import { ChartFrame } from "@/ui/ChartFrame";
import { StatTiles } from "@/ui/StatTiles";

const W = 340;
const H = 150;
const PAD = { l: 34, r: 8, t: 8, b: 20 };
const dayIndex = (d: string) => Date.parse(`${d}T00:00:00Z`) / 86_400_000;

export function WeightChart({
  readings,
  locale,
  t,
}: {
  /** Oldest first. */
  readings: WeighInView[];
  locale: Locale;
  t: Pick<Messages, "weightChart">;
}) {
  const c = t.weightChart;
  if (readings.length < 2) return <p className="text-meta text-muted">{c.few}</p>;
  const n = (v: number, d = 1) => formatNumber(String(v), locale, d);
  const last = readings.at(-1)!;
  // The trend on a past day: the last reading on or before it.
  const trendOn = (day: string) =>
    [...readings].reverse().find((r) => r.day <= day)?.trend ?? null;
  const change = (days: number) => {
    const before = trendOn(addDays(last.day, -days));
    return before === null ? null : Math.round((last.trend - before) * 10) / 10;
  };
  const signed = (v: number | null) =>
    v === null ? "—" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${n(Math.abs(v))} kg`;
  const c30 = change(30);

  const x0 = dayIndex(readings[0]!.day);
  const x1 = Math.max(x0 + 1, dayIndex(last.day));
  const all = readings.flatMap((r) => [r.kg, r.trend]);
  const lo = Math.floor(Math.min(...all) - 0.5);
  const hi = Math.ceil(Math.max(...all) + 0.5);
  const x = (d: string) => PAD.l + ((dayIndex(d) - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const y = (kg: number) => PAD.t + ((hi - kg) / (hi - lo)) * (H - PAD.t - PAD.b);
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const date = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  const line = readings
    .map((r, i) => `${i ? "L" : "M"}${x(r.day)},${y(r.trend)}`)
    .join(" ");

  return (
    <div className="flex flex-col gap-3">
      <StatTiles
        stats={[
          { label: c.trendNow, value: `${n(last.trend)} kg` },
          { label: c.change7, value: signed(change(7)) },
          { label: c.change30, value: signed(c30) },
          {
            label: c.perWeek,
            value: c30 === null ? "—" : signed(Math.round((c30 / 30) * 7 * 10) / 10),
          },
        ]}
      />
      <ChartFrame
        title={c.title}
        icon={<Scale size={16} aria-hidden="true" />}
        summary={fill(c.summary, { n: String(readings.length) })}
        scroll={false}
        footer={<p className="text-meta text-muted">{c.legend}</p>}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={c.label}>
          {ticks.map((k) => (
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
                {k}
              </text>
            </g>
          ))}
          <text x={PAD.l} y={H - 4} className="fill-muted text-meta">
            {date(readings[0]!.day)}
          </text>
          <text x={W - PAD.r} y={H - 4} textAnchor="end" className="fill-muted text-meta">
            {date(last.day)}
          </text>
          {readings.map((r) => (
            <circle
              key={r.id}
              cx={x(r.day)}
              cy={y(r.kg)}
              r={3.5}
              className="fill-macro-fat"
              opacity={0.25 + 0.75 * r.reliability}
            >
              <title>{`${date(r.day)} · ${n(r.kg)} kg · ${Math.round(r.reliability * 100)} %`}</title>
            </circle>
          ))}
          <path d={line} fill="none" strokeWidth={2.5} className="stroke-herb" />
        </svg>
      </ChartFrame>
    </div>
  );
}
