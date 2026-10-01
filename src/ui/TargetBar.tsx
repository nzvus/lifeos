/**
 * ui/TargetBar.tsx — one nutrient as a labelled bar against its target.
 *
 * The bar's scale runs to 125 % of the target, with a small tick at 100 %,
 * so going OVER is visible as a bar passing the tick, not just a full bar.
 * Colour/opacity come from ui/targetTone.ts (graded by kind and distance).
 * Text: "value / target unit", plus a short status line (what's left or how
 * much over), an "auto" marker when the target is a recommended default, and
 * where the plan leads in numbers ("With the plan: 1950 / 2700 kcal · 750
 * kcal left"), not only as the translucent part of the bar.
 */
import type { ReactNode } from "react";
import { Badge } from "./Badge";

type Props = {
  icon: ReactNode;
  label: string;
  /** Indented "of which…" row (sugars, saturated fat). */
  sub?: boolean;
  value: string; // formatted, e.g. "82 / 150 g"
  status?: string; // formatted, e.g. "68 g left"
  ratio: number | null; // null = no target: no bar fill
  /** Eaten + planned (ADR-0009), drawn translucent beyond the eaten fill. */
  plannedRatio?: number;
  /** The same in words, when the plan changes this nutrient. */
  planned?: string;
  color: string;
  opacity: number;
  autoLabel?: string; // e.g. "auto", when the target is a recommended default
  autoHint?: string; // tooltip explaining where the auto target comes from
  /** "row": label and value on one line (default); "tile": the value large,
   *  under the label — for a grid of tiles (the cruscotto theme). */
  layout?: "row" | "tile";
};

const SCALE = 1.25;

export function TargetBar({
  icon,
  label,
  sub,
  value,
  status,
  ratio,
  plannedRatio,
  planned,
  color,
  opacity,
  autoLabel,
  autoHint,
  layout = "row",
}: Props) {
  const scaled = (r: number) => (Math.min(r, SCALE) / SCALE) * 100;
  const width = ratio === null ? 0 : scaled(ratio);
  return (
    <div className={`flex flex-col gap-0.5 ${sub ? "pl-5" : ""}`}>
      <div
        className={
          layout === "tile"
            ? "flex flex-col gap-0.5 text-meta"
            : "flex items-baseline justify-between gap-2 text-meta"
        }
      >
        <span
          className={`flex items-center gap-1.5 ${sub ? "text-muted" : "font-semibold"}`}
        >
          {icon}
          {label}
          {autoLabel && <Badge title={autoHint}>{autoLabel}</Badge>}
        </span>
        <span
          className={`font-display tabular-nums ${layout === "tile" ? "text-section font-bold" : ""}`}
        >
          {value}
        </span>
      </div>
      <div className="relative h-2 w-full bg-hairline" aria-hidden="true">
        {ratio !== null && plannedRatio !== undefined && plannedRatio > ratio && (
          <div
            className="absolute top-0 left-0 h-2"
            style={{
              width: `${scaled(plannedRatio)}%`,
              background: color,
              opacity: 0.25,
            }}
          />
        )}
        {ratio !== null && (
          <div
            className="relative h-2"
            style={{ width: `${width}%`, background: color, opacity }}
          />
        )}
        {ratio !== null && (
          // the 100 % tick: at 1 / 1.25 = 80 % of the width
          <div
            className="absolute top-0 -mt-0.5 h-3 w-0.5 bg-ink"
            style={{ left: `${100 / SCALE}%` }}
          />
        )}
      </div>
      {status && <span className="text-meta text-muted">{status}</span>}
      {planned && (
        <span className="text-meta text-muted italic tabular-nums">{planned}</span>
      )}
    </div>
  );
}
