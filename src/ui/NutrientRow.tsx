/**
 * ui/NutrientRow.tsx — one nutrient, simply (ADR-0025 follow-up, the
 * developer chose "colour = state"): the name, the amount, ONE status in
 * words ("8 g to go", "in the zone", "past 97 g"), and a thin bar coloured
 * by that state — amber short of the good zone, green in it, red past a
 * health maximum — with the good zone barely marked and the plan as a
 * shadow. Floors, ceilings, the target and the plan in numbers open on tap
 * (a native <details>: no JavaScript).
 */
import { Check, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "./Badge";

export type RowState = "none" | "short" | "good" | "high" | "over";

const FILL: Record<RowState, string> = {
  none: "bg-muted",
  short: "bg-warn",
  good: "bg-herb",
  high: "bg-warn",
  over: "bg-tomato",
};

export function NutrientRow({
  icon,
  label,
  sub = false,
  amount,
  status,
  state,
  eaten,
  withPlan,
  zone,
  max,
  details,
  autoLabel,
}: {
  icon?: ReactNode;
  label: string;
  /** "of which…" rows (sugars, saturated fat): indented, smaller. */
  sub?: boolean;
  amount: string;
  status?: string;
  state: RowState;
  eaten: number;
  withPlan?: number;
  /** The good zone, in the same unit; null = no bar. */
  zone: { low: number; high: number } | null;
  /** The bar's full scale. */
  max: number;
  details?: ReactNode;
  autoLabel?: string;
}) {
  const x = (v: number) => `${(Math.max(0, Math.min(v, max)) / max) * 100}%`;
  const head = (
    <span className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between gap-2">
        <span
          className={`flex items-center gap-1.5 ${sub ? "text-meta text-muted" : "font-semibold"}`}
        >
          {icon}
          {label}
          {state === "good" && (
            <Check size={14} aria-hidden="true" className="text-herb" />
          )}
          {state === "over" && (
            <AlertTriangle size={14} aria-hidden="true" className="text-tomato" />
          )}
          {autoLabel && <Badge>{autoLabel}</Badge>}
        </span>
        <span className={`font-display tabular-nums ${sub ? "text-meta" : "text-item"}`}>
          {amount}
        </span>
      </span>
      {zone && (
        <span
          className="relative block h-1.5 w-full rounded-badge bg-hairline"
          aria-hidden="true"
        >
          <span
            className="absolute -inset-y-0.5 rounded-badge border border-herb/60"
            style={{ left: x(zone.low), width: `calc(${x(zone.high)} - ${x(zone.low)})` }}
          />
          {withPlan !== undefined && withPlan > eaten && (
            <span
              className={`absolute inset-y-0 left-0 rounded-badge opacity-30 ${FILL[state]}`}
              style={{ width: x(withPlan) }}
            />
          )}
          <span
            className={`absolute inset-y-0 left-0 rounded-badge ${FILL[state]}`}
            style={{ width: x(eaten) }}
          />
        </span>
      )}
      {status && (
        <span
          className={`text-meta ${state === "over" ? "text-tomato" : state === "good" ? "text-herb" : "text-muted"}`}
        >
          {status}
        </span>
      )}
    </span>
  );
  if (!details) return <div className={sub ? "pl-5" : ""}>{head}</div>;
  return (
    <details className={`group ${sub ? "pl-5" : ""}`}>
      <summary className="cursor-pointer list-none">{head}</summary>
      <div className="flex flex-col gap-0.5 pt-1.5 text-meta text-muted tabular-nums">
        {details}
      </div>
    </details>
  );
}
