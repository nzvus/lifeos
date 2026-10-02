/**
 * ui/ConcentricRings.tsx — several progress rings nested inside each other
 * (outermost = first item), one per nutrient: the whole day in one figure.
 *
 * Each ring: a grey track, and an arc from 12 o'clock for the share reached
 * (stroke-dasharray trick, see the comments in the code). Past 100 % the ring
 * is complete and a second lap, dashed in red, shows the excess (up to
 * +100 %): the ring keeps its colour, the excess is what stands out.
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
/**
 * A dashed arc of `length` from 12 o'clock: short dashes and gaps up to the
 * length, then a gap the size of the circle (the same trick as the arc).
 */
export function dashes(length: number, circ: number): string {
  const dash = 5;
  const gap = 3;
  const out: number[] = [];
  for (let at = 0; at < length; at += dash + gap)
    out.push(Math.min(dash, length - at), gap);
  out[out.length - 1] = circ; // the last gap hides the rest of the lap
  return out.join(" ");
}

type Props = { rings: RingSpec[]; size?: number; label: string; children?: ReactNode };

export function ConcentricRings({ rings, size = 200, label, children }: Props) {
  // Thin enough that five rings leave a centre wide enough for the label.
  const stroke = 9;
  const gap = 2;
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
                  strokeWidth={stroke * 0.6}
                  strokeDasharray={dashes(Math.min(1, ring.ratio - 1) * circ, circ)}
                  className="stroke-tomato"
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
