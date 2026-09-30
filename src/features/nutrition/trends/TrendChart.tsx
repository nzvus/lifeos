/**
 * features/nutrition/trends/TrendChart.tsx — one nutrient over a range of
 * days (7, 30, 90…), as plain SVG bars (no chart library: a few rectangles
 * are all it takes, and they use the theme's tokens).
 *
 * Each bar: the day's eaten total, coloured like the day panel (ui/
 * targetTone: graded by the target's kind and distance); a short line marks
 * the target; every bar links to its day. Up to a week the chart fits the
 * width; longer ranges keep a readable bar width and scroll sideways,
 * starting at the most recent day (dir="rtl" on the scroller, no script).
 * Totals and targets come from core (getHistory), already rounded; heights
 * are only proportions.
 */
import Link from "next/link";
import { assessTarget, TARGET_KIND } from "@/core/nutrition/targets";
import type { NutrientKey } from "@/core/nutrition/nutrients";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import { NutrientIcon, NUTRIENT_VAR } from "@/ui/NutrientIcon";
import { targetTone } from "@/ui/targetTone";

export type TrendDay = {
  day: string;
  /** Eaten total, or null if nothing was logged that day. */
  value: string | null;
  target: string | null;
};

type Props = {
  nutrient: NutrientKey;
  days: TrendDay[];
  title: string;
  unit: string;
  /** Already filled in, e.g. "average 1 850 kcal". */
  summary?: string;
  locale: Locale;
  label: string;
};

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };
const H = 110;
const BAR_AREA = 86; // the rest is labels
const FIT = 7; // up to this many days, fit the width; beyond, scroll

export function TrendChart({
  nutrient,
  days,
  title,
  unit,
  summary,
  locale,
  label,
}: Props) {
  const values = days.map((d) => (d.value === null ? 0 : Number(d.value)));
  const targets = days.map((d) => (d.target === null ? null : Number(d.target)));
  const max = Math.max(1, ...values, ...targets.map((x) => x ?? 0));
  const scroll = days.length > FIT;
  const slot = scroll ? 14 : 40;
  const W = slot * days.length;
  const barW = slot * (scroll ? 0.7 : 0.6);
  const date = (d: string) => new Date(`${d}T12:00:00Z`);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(INTL[locale], { ...o, timeZone: "UTC" });
  const weekday = fmt({ weekday: "narrow" });
  const month = fmt({ month: "short" });
  /** Axis label: weekdays for a week; for longer ranges, a few dates. */
  const axis = (d: string): string | null => {
    if (!scroll) return weekday.format(date(d));
    const dom = date(d).getUTCDate();
    if (dom === 1) return month.format(date(d));
    if (days.length <= 31 ? dom % 5 === 0 : dom === 15) return String(dom);
    return null;
  };

  const svg = (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={scroll ? W : undefined}
      className={scroll ? "block" : "w-full"}
      role="img"
      aria-label={`${title} — ${label}`}
    >
      {days.map((d, i) => {
        const v = values[i]!;
        const target = targets[i]!;
        const h = (v / max) * BAR_AREA;
        const x = i * slot + (slot - barW) / 2;
        const a = assessTarget(d.value ?? "0", d.target, TARGET_KIND[nutrient]);
        const tone = targetTone({
          kind: TARGET_KIND[nutrient],
          status: a.status,
          ratio: a.status === "none" ? 0 : a.ratio,
          base: NUTRIENT_VAR[nutrient]!,
        });
        const text = axis(d.day);
        const tip = `${d.day}: ${d.value === null ? "—" : `${formatNumber(d.value, locale, 0)} ${unit}`}`;
        return (
          <Link key={d.day} href={`/?day=${d.day}`} aria-label={tip}>
            <title>{tip}</title>
            {/* invisible full-height hit area, so short bars are easy to tap */}
            <rect
              x={i * slot}
              y={0}
              width={slot}
              height={H}
              className="fill-transparent"
            />
            {d.value !== null && (
              <rect
                x={x}
                y={BAR_AREA - h}
                width={barW}
                height={Math.max(h, 1)}
                rx={2}
                style={{ fill: tone.color, opacity: tone.opacity }}
              />
            )}
            {target !== null && (
              <rect
                x={x - 2}
                y={BAR_AREA - (target / max) * BAR_AREA - 1}
                width={barW + 4}
                height={2}
                className="fill-ink"
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
  );

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex items-baseline justify-between gap-2 text-meta">
        <span className="flex items-center gap-1.5 font-semibold">
          <NutrientIcon name={nutrient} />
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
            {svg}
          </div>
        </div>
      ) : (
        svg
      )}
    </figure>
  );
}
