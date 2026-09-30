/**
 * ui/ConcentricRings.tsx — several progress rings nested inside each other
 * (outermost = first item), one per nutrient: the whole day in one figure.
 *
 * Each ring: a grey track, and an arc from 12 o'clock for the share reached
 * (stroke-dasharray trick, see the comments in the code). Past 100 % the ring
 * is complete and a thinner second lap shows the excess (up to +100 %).
 * Colour and opacity come from the caller (ui/targetTone.ts).
 */
import type { ReactNode } from "react";

export type RingSpec = {
  key: string;
  ratio: number;
  color: string;
  opacity: number;
  label: string;
  /** Eaten + planned (ADR-0009): drawn translucent BEHIND the eaten arc. */
  plannedRatio?: number;
};
type Props = { rings: RingSpec[]; size?: number; label: string; children?: ReactNode };

export function ConcentricRings({ rings, size = 200, label, children }: Props) {
  const stroke = 11;
  const gap = 3;
  const c = size / 2;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
      >
        {rings.map((ring, i) => {
          const r = c - stroke / 2 - i * (stroke + gap);
          if (r <= stroke) return null; // too many rings for this size
          const circ = 2 * Math.PI * r;
          // A dash as long as the reached share of the circumference, then a
          // gap as long as the whole circle: only the dash is visible.
          const arc = (share: number) =>
            `${Math.max(0, Math.min(1, share)) * circ} ${circ}`;
          return (
            <g key={ring.key} transform={`rotate(-90 ${c} ${c})`}>
              <title>{ring.label}</title>
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                strokeWidth={stroke}
                className="stroke-hairline"
              />
              {ring.plannedRatio !== undefined && ring.plannedRatio > ring.ratio && (
                <circle
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={arc(ring.plannedRatio)}
                  style={{ stroke: ring.color, opacity: 0.25 }}
                />
              )}
              <circle
                cx={c}
                cy={c}
                r={r}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={arc(ring.ratio)}
                style={{ stroke: ring.color, opacity: ring.opacity }}
              />
              {ring.ratio > 1 && (
                <circle
                  cx={c}
                  cy={c}
                  r={r}
                  fill="none"
                  strokeWidth={stroke * 0.45}
                  strokeLinecap="round"
                  strokeDasharray={arc(ring.ratio - 1)}
                  className="stroke-ink"
                  style={{ opacity: 0.55 }}
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
