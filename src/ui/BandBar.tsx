/**
 * ui/BandBar.tsx — a nutrient against its band (ADR-0023/0025), drawn in
 * grams, not as a ratio of the target:
 *
 *   ░░ red ░░|── neutral ──|██ good zone ██|── neutral ──|▒ past max ▒
 *          floor          low            high         ceiling
 *
 * The eaten amount is the solid line on top, the plan translucent beyond
 * it, the target a black tick. Under it, a legend with the numbers and
 * a swatch per zone, so the colours are never the only clue.
 */
import type { ReactNode } from "react";
import { Badge } from "./Badge";

type Props = {
  icon: ReactNode;
  label: string;
  value: string; // "82 / 150 g"
  status?: string;
  planned?: string;
  eaten: number;
  withPlan?: number;
  target: number | null;
  band: { floor: number; low: number; high: number; ceiling: number };
  color: string;
  /** The legend words, already filled: floor, good, ceiling. */
  legend: { floor: string; good: string; ceiling: string };
  autoLabel?: string;
  autoHint?: string;
};

export function BandBar({
  icon,
  label,
  value,
  status,
  planned,
  eaten,
  withPlan,
  target,
  band,
  color,
  legend,
  autoLabel,
  autoHint,
}: Props) {
  const max = Math.max(band.ceiling * 1.2, eaten, withPlan ?? 0, target ?? 0) || 1;
  const x = (v: number) => `${(Math.min(v, max) / max) * 100}%`;
  const seg = (from: number, to: number, cls: string) =>
    to > from && (
      <div
        className={`absolute inset-y-0 ${cls}`}
        style={{ left: x(from), width: `calc(${x(to)} - ${x(from)})` }}
      />
    );
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-meta">
        <span className="flex items-center gap-1.5 font-semibold">
          {icon}
          {label}
          {autoLabel && <Badge title={autoHint}>{autoLabel}</Badge>}
        </span>
        <span className="font-display tabular-nums">{value}</span>
      </div>
      <div
        className="relative h-4 w-full overflow-hidden rounded-badge bg-hairline"
        aria-hidden="true"
      >
        {seg(0, band.floor, "bg-tomato/25")}
        {seg(band.low, band.high, "bg-herb/35")}
        {band.ceiling > band.high && seg(band.high, band.ceiling, "bg-hairline")}
        {seg(band.ceiling, max, "bg-warn/25")}
        {withPlan !== undefined && withPlan > eaten && (
          <div
            className="absolute top-1 left-0 h-2"
            style={{ width: x(withPlan), background: color, opacity: 0.3 }}
          />
        )}
        <div
          className="absolute top-1 left-0 h-2"
          style={{ width: x(eaten), background: color }}
        />
        {target !== null && (
          <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: x(target) }} />
        )}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-meta text-muted tabular-nums">
        <li className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-badge bg-tomato/40"
            aria-hidden="true"
          />
          {legend.floor}
        </li>
        <li className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-badge bg-herb/50"
            aria-hidden="true"
          />
          {legend.good}
        </li>
        <li className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-badge bg-warn/40"
            aria-hidden="true"
          />
          {legend.ceiling}
        </li>
      </ul>
      {status && <span className="text-meta">{status}</span>}
      {planned && (
        <span className="text-meta text-muted italic tabular-nums">{planned}</span>
      )}
    </div>
  );
}
