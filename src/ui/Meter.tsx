/**
 * ui/Meter.tsx — one labelled progress bar: an icon + name, "value / target",
 * and a bar filled up to the share reached. Coloured with the nutrient's
 * colour while under target, tomato once over (the colour carries meaning).
 */
import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  /** e.g. "82 / 150 g"; already formatted. */
  value: string;
  /** 0–100 (capped by the caller); null = no target, no bar fill. */
  percent: number | null;
  over: boolean;
  /** Tailwind background class for the fill, e.g. "bg-macro-protein". */
  colorClass: string;
};

export function Meter({ icon, label, value, percent, over, colorClass }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-semibold">
          {icon}
          {label}
        </span>
        <span
          className={`font-display tabular-nums ${over ? "font-bold text-tomato" : ""}`}
        >
          {value}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden bg-hairline" aria-hidden="true">
        {percent !== null && (
          <div
            className={`h-2 ${over ? "bg-tomato" : colorClass}`}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}
