/**
 * ui/Ring.tsx — a circular gauge (SVG): a full grey track, and a coloured arc
 * for the share reached. Anything inside `children` is centred in the ring
 * (e.g. "1.782 kcal left").
 *
 * How the arc is drawn: a circle's outline is dashed with one dash as long
 * as the reached share of the circumference and one gap for the rest
 * (stroke-dasharray), rotated to start at 12 o'clock.
 */
import type { ReactNode } from "react";

type Props = {
  /** 0–100; values above 100 are drawn full. */
  percent: number;
  /** Tailwind stroke class, e.g. "stroke-herb" or "stroke-tomato". */
  colorClass: string;
  label: string;
  children?: ReactNode;
  size?: number;
};

export function Ring({ percent, colorClass, label, children, size = 168 }: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const reached = (Math.min(Math.max(percent, 0), 100) / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-hairline"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${reached} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className={colorClass}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
