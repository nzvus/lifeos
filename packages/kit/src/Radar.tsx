/**
 * Radar (bars study §13–14, his 20 Nov «qualche poligono… le scale? i range piu graduali e
 * sfumati? molto spazio è sprecato… va trovato qualcosa per le cose in generale»): any set of
 * measures as one shape. Each axis is a measure against its own target (the dashed regular
 * polygon); the day is the white shape; behind each axis its ranges blend from one colour to the
 * next (VIS-52), so where a vertex sits says how it is judged with no word. A scale in % of the
 * target is written once; each axis end has its icon (or a short name) and its one number. A
 * plan, when there is one, is the dashed outline beyond the done shape (VIS-22).
 */
import { useId } from "react";
import { Glyph } from "./Glyph";

export type RadarAxis = {
  /** A nutrient key for its icon (kcal, protein, …); else `short` is written. */
  icon?: string;
  short?: string;
  name: string;
  v: number;
  /** Planned on top of `v`. */
  plan?: number;
  t: number;
  /** Its ranges in its own unit: where each level starts. */
  ranges: { from: number; level: "bad" | "fair" | "good" | "danger" }[];
  /** The one number at its end («181», «3.478»). */
  n: string;
  /** Everything, for a screen reader (rule 4). */
  label: string;
};

const C = 120;
const R = 84; // the radius of MAX × the target
const MAX = 2;
const COLOR = {
  danger: "var(--heat-danger)",
  bad: "var(--heat-bad)",
  fair: "var(--heat-fair)",
  good: "var(--heat-good)",
};

const angle = (i: number, n: number) => (i / n) * 2 * Math.PI - Math.PI / 2;
const pt = (a: number, r: number) => [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
const rad = (share: number) => (Math.max(0, Math.min(share, MAX)) / MAX) * R;
const path = (pts: (readonly [number, number])[]) =>
  pts.map(([x, y], i) => (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)).join("") +
  "Z";

/** The gradient stops of an axis: each range's colour at its middle, so the edges blend. */
function stops(a: RadarAxis) {
  return a.ranges.map((r, i) => {
    const from = Math.min(r.from / a.t, MAX);
    const to = Math.min((a.ranges[i + 1]?.from ?? a.t * MAX) / a.t, MAX);
    return { at: (from + to) / 2 / MAX, color: COLOR[r.level] };
  });
}

export function Radar({
  axes,
  label,
  scaleLabel = "%",
}: {
  axes: RadarAxis[];
  label: string;
  /** The unit of the rings («%»: of each target). */
  scaleLabel?: string;
}) {
  const id = useId().replace(/:/g, "");
  const n = axes.length;
  const step = (2 * Math.PI) / n;
  const ring = (s: number) => path(axes.map((_, i) => pt(angle(i, n), rad(s))));
  const done = axes.map((a, i) => pt(angle(i, n), rad(a.v / a.t)));
  const planned = axes.some((a) => a.plan)
    ? axes.map((a, i) => pt(angle(i, n), rad((a.v + (a.plan ?? 0)) / a.t)))
    : null;
  // the scale, written once along the gap between the first two axes
  const gap = angle(0, n) + step / 2;
  return (
    <div
      className="k-radar"
      role="img"
      aria-label={label + ": " + axes.map((a) => a.name + " " + a.label).join(", ")}
    >
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <defs>
          {axes.map((a, i) => (
            <radialGradient
              key={i}
              id={`${id}g${i}`}
              gradientUnits="userSpaceOnUse"
              cx={C}
              cy={C}
              r={R}
            >
              {stops(a).map((s, j) => (
                <stop key={j} offset={s.at} style={{ stopColor: s.color }} />
              ))}
            </radialGradient>
          ))}
          <clipPath id={`${id}c`}>
            <path d={ring(MAX)} />
          </clipPath>
          <filter id={`${id}b`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <g clipPath={`url(#${id}c)`}>
          <g filter={`url(#${id}b)`} className="zones">
            {axes.map((_, i) => {
              const [x0, y0] = pt(angle(i, n) - step / 2, R * 1.3);
              const [x1, y1] = pt(angle(i, n) + step / 2, R * 1.3);
              return (
                <path
                  key={i}
                  d={`M${C} ${C}L${x0} ${y0}A${R * 1.3} ${R * 1.3} 0 0 1 ${x1} ${y1}Z`}
                  fill={`url(#${id}g${i})`}
                />
              );
            })}
          </g>
        </g>
        {[0.5, 1.5, 2].map((s) => (
          <path key={s} d={ring(s)} className="ring" />
        ))}
        <path d={ring(1)} className="target" />
        {axes.map((_, i) => {
          const [x, y] = pt(angle(i, n), R);
          return <line key={i} x1={C} y1={C} x2={x} y2={y} className="spoke" />;
        })}
        {[0.5, 1, 1.5, 2].map((s) => {
          const [x, y] = pt(gap, rad(s) * Math.cos(step / 2));
          return (
            <text
              key={s}
              x={x}
              y={y}
              className="tick"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {s * 100}
              {s === MAX ? " " + scaleLabel : ""}
            </text>
          );
        })}
        {planned && <path d={path(planned)} className="plan" />}
        <path d={path(done)} className="day" />
        {done.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" className="dot" />
        ))}
      </svg>
      {axes.map((a, i) => {
        const [x, y] = pt(angle(i, n), R + 22);
        return (
          <span
            key={a.name}
            className="end"
            style={{ left: (x / 240) * 100 + "%", top: (y / 240) * 100 + "%" }}
          >
            {a.icon ? <Glyph of={{ nutrient: a.icon }} size="s" /> : <b>{a.short}</b>}
            <span className="n">{a.n}</span>
          </span>
        );
      })}
    </div>
  );
}
