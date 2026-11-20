/**
 * Ridge (bars study §15, his 20 Nov «tu puoi fare di meglio»): the bar takes the shape of its
 * ranges. Each measure is a hill: tallest where the value is best, sloping down through «ok» to
 * «pessimo», its colour blending along it (VIS-52, no words). The target is the peak, so it needs
 * no tick; the scale is the few numbers under the hill where its slope changes (rule 7). His
 * amount fills the hill from the left in its own colour (VIS-50), split by its parts when it has
 * them; a plan is hatched after it (VIS-22). Stacked, the hills overlap like a ridgeline and their
 * peaks line up: how far each fill passes that line is the day at a glance. The icon and the one
 * number sit in the low left of the hill, so the bar keeps the full width (§67).
 */
import { useId } from "react";
import { F } from "./format";
import { Glyph } from "./Glyph";

type Level = "bad" | "fair" | "good" | "danger";
export type RidgeMeasure = {
  /** A nutrient key for its icon. */
  icon: string;
  name: string;
  v: number;
  plan?: number;
  t: number;
  ranges: { from: number; level: Level }[];
  color: string;
  /** Its parts, adding up to `v` (a macro's kinds), each in its own shade. */
  parts?: { v: number; color: string }[];
  /** The one number («181»); the unit is the group's. */
  n: string;
  label: string;
};

const W = 300;
const HILL = 30; // the tallest a hill gets
const BASE = 3; // the thinnest
const TALL: Record<Level, number> = { good: 1, fair: 0.5, bad: 0.16, danger: 0.04 };
const COLOR: Record<Level, string> = {
  good: "var(--heat-good)",
  fair: "var(--heat-fair)",
  bad: "var(--heat-bad)",
  danger: "var(--heat-danger)",
};
const N = 90; // samples along a hill

/** Where the scale ends: twice the target, so every peak lines up at the middle. */
const topOf = (m: RidgeMeasure) => m.t * 2;
const levelAt = (m: RidgeMeasure, x: number) =>
  m.ranges.reduce<Level>(
    (l, r) => (x >= r.from ? r.level : l),
    m.ranges[0]?.level ?? "fair",
  );

/** The hill's height along its scale: each range's height, smoothed so the slopes are gradual. */
function profile(m: RidgeMeasure) {
  const top = topOf(m);
  const raw = Array.from({ length: N + 1 }, (_, i) => TALL[levelAt(m, (i / N) * top)]);
  const k = 5; // the smoothing window, in samples
  return raw.map((_, i) => {
    let s = 0;
    let c = 0;
    for (let j = i - k; j <= i + k; j++) {
      const v = raw[Math.max(0, Math.min(N, j))]!;
      const w = k + 1 - Math.abs(i - j);
      s += v * w;
      c += w;
    }
    return BASE + (s / c) * (HILL - BASE);
  });
}

function hillPath(h: number[], y0: number) {
  const pts = h.map((v, i) => `${((i / N) * W).toFixed(1)} ${(y0 - v).toFixed(1)}`);
  return `M0 ${y0}L${pts.join("L")}L${W} ${y0}Z`;
}

/** The range edges as numbers under the hill, dropping one too close to the last kept. */
function edges(m: RidgeMeasure) {
  const top = topOf(m);
  const out: number[] = [];
  for (const r of m.ranges) {
    if (r.from <= 0 || r.from >= top) continue;
    const last = out[out.length - 1];
    if (last === undefined || (r.from - last) / top > 0.11) out.push(r.from);
  }
  return out;
}

export function Ridge({
  measures,
  unit,
  label,
}: {
  measures: RidgeMeasure[];
  /** The unit of the numbers, written once («g», with kcal on its own icon). */
  unit: string;
  label: string;
}) {
  const id = useId().replace(/:/g, "");
  const STEP = HILL + 20; // each hill, its numbers under it, and a gap
  const H = measures.length * STEP + 14;
  return (
    <div
      className="k-ridge"
      role="img"
      aria-label={label + ": " + measures.map((m) => m.name + " " + m.label).join(", ")}
    >
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          {measures.map((m, i) => {
            const top = topOf(m);
            return (
              <linearGradient key={i} id={`${id}z${i}`} x1="0" x2="1" y1="0" y2="0">
                {m.ranges.map((r, j) => {
                  const to = m.ranges[j + 1]?.from ?? top;
                  const mid = Math.min(1, (r.from + Math.min(to, top)) / 2 / top);
                  return (
                    <stop key={j} offset={mid} style={{ stopColor: COLOR[r.level] }} />
                  );
                })}
              </linearGradient>
            );
          })}
        </defs>
        <line x1={W / 2} x2={W / 2} y1={4} y2={H - 14} className="peakline" />
        {measures.map((m, i) => {
          const y0 = (i + 1) * STEP;
          const top = topOf(m);
          const hill = hillPath(profile(m), y0);
          const x = (v: number) => Math.min(W, (v / top) * W);
          let acc = 0;
          const parts = m.parts?.length ? m.parts : [{ v: m.v, color: m.color }];
          return (
            <g key={m.name}>
              <clipPath id={`${id}c${i}`}>
                <path d={hill} />
              </clipPath>
              <path d={hill} className="zone" fill={`url(#${id}z${i})`} />
              <g clipPath={`url(#${id}c${i})`}>
                {parts.map((p, j) => {
                  const x0 = x(acc);
                  acc += p.v;
                  return (
                    <rect
                      key={j}
                      x={x0}
                      y={y0 - HILL - 1}
                      width={Math.max(0, x(acc) - x0)}
                      height={HILL + 1}
                      style={{ fill: p.color }}
                    />
                  );
                })}
                {m.plan ? (
                  <rect
                    x={x(m.v)}
                    y={y0 - HILL - 1}
                    width={Math.max(0, x(m.v + m.plan) - x(m.v))}
                    height={HILL + 1}
                    className="plan"
                    style={{ color: m.color }}
                  />
                ) : null}
              </g>
              <path d={hill} className="edge" />
              {m.v > top && <path d={`M${W - 6} ${y0 - 9}l6 4l-6 4z`} className="more" />}
              {edges(m).map((e) => (
                <text key={e} x={x(e)} y={y0 + 8} className="tick" textAnchor="middle">
                  {F.n(e, e < 10 && e % 1 ? 1 : 0)}
                </text>
              ))}
            </g>
          );
        })}
        <text x={W} y={H - 2} className="unit" textAnchor="end">
          {unit}
        </text>
      </svg>
      {measures.map((m, i) => (
        <span
          key={m.name}
          className="lab"
          style={{ top: (((i + 1) * STEP - HILL + 2) / H) * 100 + "%" }}
        >
          <Glyph of={{ nutrient: m.icon }} size="xs" />
          <b>{m.n}</b>
        </span>
      ))}
    </div>
  );
}
