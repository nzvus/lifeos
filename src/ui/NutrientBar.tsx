/**
 * ui/NutrientBar.tsx — one nutrient in one line (2026-10-04: "the day with
 * the plan" was too big and said too little: almost only bars). Short name,
 * a bar, the amount. The bar: the good zone outlined, the limit as a tick,
 * eaten solid and the plan lighter, coloured by state (ui/NutrientRow's
 * colours: amber short, green in the zone, red past a health maximum). The
 * state in words goes to screen readers and the tooltip.
 */
import { AlertTriangle, Check } from "lucide-react";
import type { ReactNode } from "react";
import { STATE_FILL, type RowState } from "./NutrientRow";

export function NutrientBar({
  icon,
  label,
  amount,
  status,
  state,
  eaten,
  withPlan,
  zone,
  limit,
  max,
  sub = false,
}: {
  icon: ReactNode;
  label: string;
  /** "606 / 228 g". */
  amount: string;
  /** In words: "8 g to go · eaten 0 g". */
  status?: string;
  state: RowState;
  eaten: number;
  withPlan: number;
  /** The good zone; null = none. */
  zone: { low: number; high: number } | null;
  /** A maximum (health limit), drawn as a tick. */
  limit: number | null;
  /** The bar's full scale. */
  max: number;
  /** "Of which" rows: lighter. */
  sub?: boolean;
}) {
  const x = (v: number) => `${(Math.max(0, Math.min(v, max)) / max) * 100}%`;
  return (
    <div className="flex items-center gap-2" title={status}>
      <span
        className={`flex w-24 shrink-0 items-center gap-1 text-meta ${sub ? "pl-2 text-muted" : "font-semibold"}`}
      >
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span
        className="relative block h-2.5 min-w-0 flex-1 rounded-badge bg-hairline"
        aria-hidden="true"
      >
        {zone && (
          <span
            className="absolute -inset-y-0.5 rounded-badge border border-herb"
            style={{ left: x(zone.low), width: `calc(${x(zone.high)} - ${x(zone.low)})` }}
          />
        )}
        {withPlan > eaten && (
          <span
            className={`absolute inset-y-0 left-0 rounded-badge opacity-40 ${STATE_FILL[state]}`}
            style={{ width: x(withPlan) }}
          />
        )}
        <span
          className={`absolute inset-y-0 left-0 rounded-badge ${STATE_FILL[state]}`}
          style={{ width: x(eaten) }}
        />
        {limit !== null && (
          <span
            className="absolute -inset-y-1 w-0.5 rounded-badge bg-tomato"
            style={{ left: x(limit) }}
          />
        )}
      </span>
      <span className="flex w-24 shrink-0 items-center justify-end gap-1 font-display text-meta tabular-nums">
        {amount}
        {state === "good" && <Check size={12} aria-hidden="true" className="text-herb" />}
        {state === "over" && (
          <AlertTriangle size={12} aria-hidden="true" className="text-tomato" />
        )}
      </span>
      {status && <span className="sr-only">{status}</span>}
    </div>
  );
}
