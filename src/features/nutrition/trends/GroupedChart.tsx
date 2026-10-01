/**
 * features/nutrition/trends/GroupedChart.tsx — several nutrients side by
 * side for each day (protein, carbs, fat, fibre; or the limits), in their own
 * colours, on one scale: share of the day's target (core/nutrition/trends.ts
 * groupedBars). A line marks 100 %; a bar with no target that day is drawn
 * fainter, scaled to its own best day. Every day links to its day page.
 *
 * Under the chart, one entry per nutrient across the full width: its icon,
 * name and the period's average share of target.
 */
import Link from "next/link";
import type { GroupedBar } from "@/core/nutrition/trends";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { NUTRIENT_TEXT, NUTRIENT_VAR, NutrientIcon } from "@/ui/NutrientIcon";
import { ChartFrame, dayAxis, FIT } from "@/ui/ChartFrame";

type Props = {
  title: string;
  icon?: React.ReactNode;
  days: readonly string[];
  bars: readonly (readonly GroupedBar[])[];
  names: Record<string, string>;
  units: Record<string, string>;
  /** "{v} % of target on average" style, already translated. */
  averageOf: (percent: string) => string;
  relativeNote: string;
  locale: Locale;
  label: string;
};

const H = 120;
const BAR_AREA = 96;
/** The top of the scale: at least 125 % so the 100 % line sits below it. */
const MIN_TOP = 1.25;
const MAX_TOP = 2;

export function GroupedChart({
  title,
  icon,
  days,
  bars,
  names,
  units,
  averageOf,
  relativeNote,
  locale,
  label,
}: Props) {
  const keys = bars[0]?.map((b) => b.key) ?? [];
  const scroll = days.length > FIT;
  const barW = scroll ? 5 : 8;
  const slot = keys.length * barW + (scroll ? 6 : 16);
  const W = Math.max(slot * days.length, scroll ? 0 : 320);
  const step = W / days.length;
  const shares = bars.flat().map((b) => b.share ?? 0);
  const top = Math.min(MAX_TOP, Math.max(MIN_TOP, ...shares));
  const y = (share: number) => BAR_AREA - (Math.min(share, top) / top) * BAR_AREA;
  const axis = dayAxis(days, locale);
  const pct = (share: number) => formatNumber(String(share * 100), locale, 0);
  const anyRelative = bars.some((d) => d.some((b) => b.relative && b.share !== null));

  const svg = (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={scroll ? W : undefined}
      className={scroll ? "block" : "w-full"}
      role="img"
      aria-label={`${title} — ${label}`}
    >
      <line
        x1={0}
        x2={W}
        y1={y(1)}
        y2={y(1)}
        className="stroke-ink"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      {days.map((day, i) => {
        const group = bars[i]!;
        const x0 = i * step + (step - keys.length * barW) / 2;
        const tip = [
          day,
          ...group.map((b) =>
            b.value === null
              ? `${names[b.key]}: —`
              : `${names[b.key]}: ${formatNumber(b.value, locale, 0)}${
                  b.target ? ` / ${formatNumber(b.target, locale, 0)}` : ""
                } ${units[b.key]}${b.relative ? "" : ` (${pct(b.share ?? 0)} %)`}`,
          ),
        ].join("\n");
        const text = axis(day);
        return (
          <Link key={day} href={`/?day=${day}`} aria-label={tip}>
            <title>{tip}</title>
            <rect
              x={i * step}
              y={0}
              width={step}
              height={H}
              className="fill-transparent"
            />
            {group.map(
              (b, j) =>
                b.share !== null && (
                  <rect
                    key={b.key}
                    x={x0 + j * barW}
                    y={y(b.share)}
                    width={barW - 1}
                    height={Math.max(BAR_AREA - y(b.share), 1)}
                    rx={1}
                    style={{
                      fill: `var(${NUTRIENT_VAR[b.key]})`,
                      opacity: b.relative ? 0.4 : 1,
                    }}
                  />
                ),
            )}
            {text && (
              <text
                x={i * step + step / 2}
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
  );

  // Average share per nutrient over the logged days with a target.
  const averages = keys.map((key, j) => {
    const own = bars
      .map((d) => d[j]!)
      .filter((b) => b.share !== null && !b.relative)
      .map((b) => b.share!);
    return { key, avg: own.length ? own.reduce((a, b) => a + b, 0) / own.length : null };
  });

  return (
    <ChartFrame
      title={title}
      icon={icon}
      scroll={scroll}
      footer={
        <>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-meta @lg:grid-cols-4">
            {averages.map(({ key, avg }) => (
              <li
                key={key}
                className={`inline-flex items-center gap-1 ${NUTRIENT_TEXT[key] ?? ""}`}
              >
                <NutrientIcon name={key} size={14} />
                <span className="font-semibold">{names[key]}</span>
                <span className="font-display tabular-nums">
                  {avg === null ? "—" : averageOf(pct(avg))}
                </span>
              </li>
            ))}
          </ul>
          {anyRelative && <p className="text-meta text-muted">{relativeNote}</p>}
        </>
      }
    >
      {svg}
    </ChartFrame>
  );
}
