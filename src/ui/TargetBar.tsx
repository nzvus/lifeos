/**
 * ui/TargetBar.tsx — one nutrient as a labelled bar against its target.
 *
 * The bar's scale runs to 125 % of the target, with a small tick at 100 %,
 * so going OVER is visible as a bar passing the tick, not just a full bar.
 * Colour/opacity come from ui/targetTone.ts (graded by kind and distance).
 * Text: "value / target unit", plus a short status line (what's left or how
 * much over), and an "auto" marker when the target is a recommended default.
 */
import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  /** Indented "of which…" row (sugars, saturated fat). */
  sub?: boolean;
  value: string; // formatted, e.g. "82 / 150 g"
  status?: string; // formatted, e.g. "68 g left"
  ratio: number | null; // null = no target: no bar fill
  color: string;
  opacity: number;
  autoLabel?: string; // e.g. "auto", when the target is a recommended default
  autoHint?: string; // tooltip explaining where the auto target comes from
};

const SCALE = 1.25;

export function TargetBar({
  icon,
  label,
  sub,
  value,
  status,
  ratio,
  color,
  opacity,
  autoLabel,
  autoHint,
}: Props) {
  const width = ratio === null ? 0 : (Math.min(ratio, SCALE) / SCALE) * 100;
  return (
    <div className={`flex flex-col gap-0.5 ${sub ? "pl-5" : ""}`}>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span
          className={`flex items-center gap-1.5 ${sub ? "text-muted" : "font-semibold"}`}
        >
          {icon}
          {label}
          {autoLabel && (
            <span
              title={autoHint}
              className="border border-hairline px-1 text-xs font-normal text-muted"
            >
              {autoLabel}
            </span>
          )}
        </span>
        <span className="font-display tabular-nums">{value}</span>
      </div>
      <div className="relative h-2 w-full bg-hairline" aria-hidden="true">
        {ratio !== null && (
          <div
            className="h-2"
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
      {status && <span className="text-xs text-muted">{status}</span>}
    </div>
  );
}
