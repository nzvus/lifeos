/**
 * Radar (bars study §13, his 20 Nov «qualche poligono»): the day as a shape. One axis per
 * measure, each as a share of its own target: the target is the regular polygon, the day the
 * polygon he drew, the «good» range a green band. No words: an icon at each axis
 * end, the colours of VIS-52; the exact values in the label (rule 4) and on the next level.
 */
import { Glyph } from "./Glyph";

export type RadarAxis = {
  /** The nutrient key of its icon (kcal, protein, carbs, fat, fiber). */
  key: string;
  name: string;
  v: number;
  t: number;
  color: string;
  /** Its ranges, in its own unit: where each level starts. */
  ranges: { from: number; level: "bad" | "fair" | "good" | "danger" }[];
  label: string;
};

const R = 84; // the radius of 200 % of the target
const C = 100;
const MAX = 2; // the outer ring: twice the target

function at(i: number, n: number, share: number) {
  const a = (i / n) * 2 * Math.PI - Math.PI / 2;
  const r = (Math.min(share, MAX) / MAX) * R;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
}
const path = (pts: (readonly [number, number])[]) =>
  pts.map(([x, y], i) => (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1)).join("") +
  "Z";

/** Where a level's band starts and ends on an axis, as shares of the target. */
function band(a: RadarAxis, level: "good" | "fair") {
  const i = a.ranges.findIndex((r) => r.level === level);
  if (i < 0) return null;
  const from = a.ranges[i]!.from / a.t;
  const to = (a.ranges[i + 1]?.from ?? a.t * MAX) / a.t;
  return [from, to] as const;
}

export function Radar({ axes, label }: { axes: RadarAxis[]; label: string }) {
  const n = axes.length;
  const ring = (s: number) => path(axes.map((_, i) => at(i, n, s)));
  // the green band: from where «good» starts to where it ends, on every axis
  const good = axes.map((a) => band(a, "good") ?? [1, 1]);
  const goodPath =
    path(good.map(([, to], i) => at(i, n, to))) +
    path(good.map(([from], i) => at(i, n, from)).reverse());
  const day = axes.map((a, i) => at(i, n, a.v / a.t));
  return (
    <div
      className="k-radar"
      role="img"
      aria-label={label + ": " + axes.map((a) => a.name + " " + a.label).join(", ")}
    >
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <path d={goodPath} className="good" fillRule="evenodd" />
        {[0.5, 1.5, 2].map((s) => (
          <path key={s} d={ring(s)} className="ring" />
        ))}
        <path d={ring(1)} className="target" />
        {axes.map((_, i) => {
          const [x, y] = at(i, n, MAX);
          return <line key={i} x1={C} y1={C} x2={x} y2={y} className="spoke" />;
        })}
        <path d={path(day)} className="day" />
        {day.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4.5"
            style={{ fill: axes[i]!.color }}
            className="dot"
          />
        ))}
      </svg>
      {axes.map((a, i) => {
        const ang = (i / n) * 2 * Math.PI - Math.PI / 2;
        const x = C + (R + 14) * Math.cos(ang);
        const y = C + (R + 14) * Math.sin(ang);
        return (
          <span
            key={a.key}
            className="ico"
            style={{ left: x / 2 + "%", top: y / 2 + "%" }}
          >
            <Glyph of={{ nutrient: a.key }} size="s" />
          </span>
        );
      })}
    </div>
  );
}
