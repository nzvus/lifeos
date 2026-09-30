/**
 * features/training/exercises/ProgressChart.tsx — an exercise's estimated
 * 1RM per session as a line (plain SVG, the theme's tokens), with the first
 * and last day under it and each point linking to its session. Points
 * without an estimate (no load, more than 12 reps) are skipped.
 */
import Link from "next/link";
import type { ExercisePoint } from "@/core/training/analysis";
import { formatNumber } from "@/core/shared/format";
import type { Locale } from "@/core/shared/locales";

const W = 320;
const H = 120;
const PAD = 14;

export function ProgressChart({
  points,
  label,
  locale,
}: {
  points: readonly ExercisePoint[];
  label: string;
  locale: Locale;
}) {
  const shown = points.filter((p) => p.bestE1rm !== null);
  if (shown.length === 0) return null;
  const values = shown.map((p) => p.bestE1rm!);
  const min = Math.min(...values) * 0.95;
  const max = Math.max(...values) * 1.05;
  const x = (i: number) =>
    shown.length === 1 ? W / 2 : PAD + (i / (shown.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - ((v - min) / (max - min || 1)) * (H - 2 * PAD - 12);
  const date = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return (
    <figure className="flex flex-col gap-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
        <polyline
          points={shown.map((p, i) => `${x(i)},${y(p.bestE1rm!)}`).join(" ")}
          className="fill-none stroke-herb"
          strokeWidth={2}
        />
        {shown.map((p, i) => (
          <Link key={p.sessionId + i} href={`/training/${p.sessionId}`}>
            <title>{`${date(p.day)}: ${formatNumber(String(p.bestE1rm), locale, 1)} kg`}</title>
            <circle cx={x(i)} cy={y(p.bestE1rm!)} r={4} className="fill-herb" />
          </Link>
        ))}
        <text x={PAD} y={H - 2} className="fill-muted text-meta">
          {date(shown[0]!.day)}
        </text>
        <text x={W - PAD} y={H - 2} textAnchor="end" className="fill-muted text-meta">
          {date(shown.at(-1)!.day)}
        </text>
        <text
          x={x(shown.length - 1)}
          y={y(values.at(-1)!) - 8}
          textAnchor="end"
          className="fill-ink text-meta font-semibold"
        >
          {`${formatNumber(String(values.at(-1)), locale, 1)} kg`}
        </text>
      </svg>
      <figcaption className="text-meta text-muted">{label}</figcaption>
    </figure>
  );
}
