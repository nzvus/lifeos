/**
 * features/training/live/Stepper.tsx — a number to change with one thumb:
 * big − and + buttons around a field that can also be typed in (decimal
 * keypad), with its unit. The caller decides what one step is.
 */
"use client";

import { Minus, Plus } from "lucide-react";

const BUTTON =
  "tile inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control active:border-ink";

export function Stepper({
  value,
  unit,
  onStep,
  onType,
  less,
  more,
  decimal = false,
}: {
  value: string;
  unit: string;
  onStep: (direction: 1 | -1) => void;
  onType: (raw: string) => void;
  /** Accessible names of the buttons ("Less kg"). */
  less: string;
  more: string;
  decimal?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        aria-label={less}
        onClick={() => onStep(-1)}
        className={BUTTON}
      >
        <Minus size={18} aria-hidden="true" />
      </button>
      <input
        value={value}
        onChange={(e) => onType(e.currentTarget.value)}
        inputMode={decimal ? "decimal" : "numeric"}
        aria-label={unit}
        className="h-11 w-0 min-w-0 flex-1 rounded-control bg-paper text-center font-display text-section font-bold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-focus"
      />
      <span className="w-8 shrink-0 text-meta text-muted">{unit}</span>
      <button
        type="button"
        aria-label={more}
        onClick={() => onStep(1)}
        className={BUTTON}
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
