/**
 * features/nutrition/log/WeekChart.tsx — a small bar chart of one nutrient
 * over the last 7 days, drawn as plain SVG (no chart library: a few
 * rectangles are all it takes, and they use the theme's colour tokens).
 *
 * Each bar: the day's total. Green (herb) if at or under that day's target,
 * tomato if over, the nutrient's own colour if the day has no target. A short
 * dark tick marks the target. The shown day is outlined; every bar is a link
 * to its day. Totals and targets come from core (getHistory), already rounded
 * for display; heights are only proportions for drawing.
 */
import Link from "next/link";
import type { DaySummary } from "@/core/nutrition/repositories/history";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";
import type { Messages } from "@/i18n";
import { NutrientIcon } from "@/ui/NutrientIcon";

type Props = {
  history: DaySummary[];
  nutrient: "kcal" | "protein";
  title: string;
  /** Tailwind fill class used when a day has no target. */
  plainFill: string;
  selectedDay: string;
  locale: Locale;
  t: Pick<Messages, "glance">;
};

const INTL: Record<Locale, string> = { it: "it-IT", en: "en-GB" };
const W = 280; // drawing units; the SVG scales to the container's width
const H = 110;
const BAR_AREA = 88; // height available to bars (the rest is labels)

export function WeekChart({
  history,
  nutrient,
  title,
  plainFill,
  selectedDay,
  locale,
  t,
}: Props) {
  const values = history.map((d) => Number(d.totals.nutrients[nutrient]));
  const targets = history.map((d) =>
    d.targets?.[nutrient] ? Number(d.targets[nutrient]) : null,
  );
  // Scale to the highest bar or target, so both fit.
  const max = Math.max(1, ...values, ...targets.map((x) => x ?? 0));
  const slot = W / history.length;
  const barW = slot * 0.6;
  const weekday = new Intl.DateTimeFormat(INTL[locale], {
    weekday: "narrow",
    timeZone: "UTC",
  });

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex items-center gap-1.5 text-sm font-semibold">
        <NutrientIcon name={nutrient} />
        {title}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${title} — ${t.glance.week}`}
      >
        {history.map((d, i) => {
          const v = values[i]!;
          const target = targets[i]!;
          const h = (v / max) * BAR_AREA;
          const x = i * slot + (slot - barW) / 2;
          const fillClass =
            target === null ? plainFill : v > target ? "fill-tomato" : "fill-herb";
          const label = `${d.day}: ${formatNumber(d.totals.nutrients[nutrient], locale, 0)}`;
          return (
            <Link key={d.day} href={`/?day=${d.day}`} aria-label={label}>
              <title>{label}</title>
              {/* invisible full-height hit area, so short bars are easy to tap */}
              <rect
                x={i * slot}
                y={0}
                width={slot}
                height={H}
                className="fill-transparent"
              />
              {d.logged && (
                <rect
                  x={x}
                  y={BAR_AREA - h}
                  width={barW}
                  height={Math.max(h, 1)}
                  rx={2}
                  className={fillClass}
                />
              )}
              {target !== null && (
                <rect
                  x={x - 3}
                  y={BAR_AREA - (target / max) * BAR_AREA - 1}
                  width={barW + 6}
                  height={2}
                  className="fill-ink"
                />
              )}
              {d.day === selectedDay && (
                <rect
                  x={i * slot + 1}
                  y={1}
                  width={slot - 2}
                  height={BAR_AREA + 20}
                  rx={3}
                  className="fill-none stroke-ink"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              )}
              <text
                x={i * slot + slot / 2}
                y={H - 4}
                textAnchor="middle"
                className="fill-muted text-xs"
              >
                {weekday.format(new Date(`${d.day}T12:00:00Z`))}
              </text>
            </Link>
          );
        })}
      </svg>
    </figure>
  );
}
