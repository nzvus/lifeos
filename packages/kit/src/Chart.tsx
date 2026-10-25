/**
 * Chart (kit.md §3, the board «Grafico»): `trend` — points (the readings), a
 * trend line with its uncertainty band, a goal line; `bars` — one bar per
 * day against a band (7–9 h of sleep, the water's need), bars under it in
 * warn. Same geometry as the board (358 × 170, axis labels as HTML over the
 * SVG so they keep the body font). No state: a server component.
 */
import { F } from "./format";

export type ChartData = {
  /** One label per point or bar ("12"). */
  x: string[];
  y: number[];
  unit: string;
  /** The scale: lowest and highest value drawn. */
  lo: number;
  hi: number;
  /** trend: the smoothed line and its ± band. */
  trend?: number[];
  sd?: number;
  goal?: number;
  goalText?: string;
  /** bars: the band of what is enough. */
  bandLo?: number;
  bandHi?: number;
  /** Grid values; two at a quarter from each end when missing. */
  ticks?: number[];
  /** Decimals of the axis and the description (1). */
  decimals?: number;
};

const W = 358;
const L = 32;
const R = 6;
const T = 8;
const B = 20;

/** Pure: everything the markup draws, as numbers and strings. */
export function chartGeometry(type: "trend" | "bars", d: ChartData) {
  const H = type === "bars" ? 150 : 170;
  const span = d.hi - d.lo || 1;
  const yOf = (v: number) => T + ((d.hi - v) / span) * (H - T - B);
  const n = d.x.length;
  const xOf = (i: number) => L + (n <= 1 ? 0 : (i * (W - L - R)) / (n - 1));
  const f = (v: number) => F.n(v, d.decimals ?? 1);
  const fx = (v: number) => v.toFixed(1);
  const pct = (v: number, of: number) => ((v / of) * 100).toFixed(1) + "%";
  const ticks = d.ticks ?? [d.hi - span * 0.25, d.lo + span * 0.25];
  const clampY = (v: number) => Math.min(H - B, Math.max(T, yOf(v)));
  const bw = n > 0 ? (W - L - R) / n : 0;
  const trend = type === "trend" && d.trend && d.trend.length === n ? d.trend : null;
  const sd = d.sd ?? 0;
  const hasBand = type === "trend" ? trend !== null && sd > 0 : d.bandLo !== undefined;
  return {
    W,
    H,
    grid: ticks.map((v) => ({ y: fx(yOf(v)), pct: pct(yOf(v), H), t: f(v) })),
    xl: d.x.map((t, i) => ({
      t,
      pct: pct(type === "bars" ? L + (i + 0.5) * bw : xOf(i), W),
    })),
    goal:
      d.goal === undefined
        ? null
        : { y: fx(clampY(d.goal)), pct: pct(clampY(d.goal), H), t: d.goalText ?? "" },
    band: !hasBand
      ? null
      : type === "trend"
        ? "M" +
          trend!.map((v, i) => fx(xOf(i)) + " " + fx(yOf(v + sd))).join(" L") +
          " L" +
          trend!
            .map((v, i) => fx(xOf(i)) + " " + fx(yOf(v - sd)))
            .reverse()
            .join(" L") +
          " Z"
        : "M" +
          L +
          " " +
          fx(clampY(d.bandHi ?? d.hi)) +
          " H" +
          W +
          " V" +
          fx(clampY(d.bandLo!)) +
          " H" +
          L +
          " Z",
    line: trend
      ? trend.map((v, i) => (i ? "L" : "M") + fx(xOf(i)) + " " + fx(yOf(v))).join(" ")
      : null,
    pts: type === "trend" ? d.y.map((v, i) => ({ x: fx(xOf(i)), y: fx(clampY(v)) })) : [],
    bars:
      type === "bars"
        ? d.y.map((v, i) => ({
            x: fx(L + i * bw + bw * 0.18),
            w: fx(bw * 0.64),
            y: fx(clampY(v)),
            h: fx(Math.max(0, yOf(d.lo) - clampY(v))),
            warn: d.bandLo !== undefined && v < d.bandLo,
          }))
        : [],
    aria:
      d.x.map((t, i) => t + " " + f(d.y[i]!) + " " + d.unit).join(", ") +
      (trend ? "; trend da " + f(trend[0]!) + " a " + f(trend[n - 1]!) : ""),
  };
}

export function Chart({
  type = "trend",
  data,
  caption,
}: {
  type?: "trend" | "bars";
  data: ChartData;
  caption?: string;
}) {
  const g = chartGeometry(type, data);
  return (
    <figure className="k-figure">
      <div className="k-rel">
        {g.grid.map((x) => (
          <span
            key={"t" + x.y}
            className="k-meta k-axis"
            style={{ left: 0, top: x.pct, transform: "translateY(-110%)" }}
          >
            {x.t}
          </span>
        ))}
        {g.goal?.t && (
          <span
            className="k-meta k-axis"
            style={{ right: 0, top: g.goal.pct, transform: "translateY(-115%)" }}
          >
            {g.goal.t}
          </span>
        )}
        <svg
          className="k-chart"
          viewBox={`0 0 ${g.W} ${g.H}`}
          role="img"
          aria-label={g.aria}
        >
          {g.grid.map((x) => (
            <line key={x.y} className="grid" x1={L} x2={g.W} y1={x.y} y2={x.y} />
          ))}
          {g.band && <path className="band" d={g.band} />}
          {g.goal && (
            <line className="goal" x1={L} x2={g.W} y1={g.goal.y} y2={g.goal.y} />
          )}
          {g.line && <path className="line" d={g.line} />}
          {g.bars.map((b, i) => (
            <rect
              key={i}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={3}
              style={{ fill: b.warn ? "var(--warn)" : "var(--fam, var(--ink))" }}
            />
          ))}
          {g.pts.map((p, i) => (
            <circle key={i} className="pt" cx={p.x} cy={p.y} r={3.5} />
          ))}
        </svg>
        {/* The x labels sit in the drawing's bottom margin; "" skips one. */}
        {g.xl.map((x, i) => (
          <span
            key={i}
            className="k-meta k-axis"
            style={{ bottom: 0, left: x.pct, transform: "translateX(-50%)" }}
          >
            {x.t}
          </span>
        ))}
      </div>
      {caption && <figcaption className="k-meta">{caption}</figcaption>}
    </figure>
  );
}
