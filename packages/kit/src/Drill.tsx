/**
 * Drill proposals (bars study §12, his 20 Nov «combine the best things of them»): the best of
 * the real tools on one path. Few's bullet (the bar on its ranges, the target tick, a written
 * scale), MacroFactor's levels (a card, then the edges as numbers, then the contributors),
 * Power BI's drill (each level an ordinary bar chart, a path back up), OLAP's pivot (the same
 * total by another dimension, the face turning like a cube). Rule 8: the scale, the ranges and
 * the target are written on the drawing, in the unit of the axis.
 *
 * The kit knows no type: names, range words and units come from the caller (PAT-81).
 */
import type { CSSProperties, ReactNode } from "react";
import { F } from "./format";

export type DrillRange = {
  from: number;
  /** The word of this range («pessimo», «ok», «ottimo»). */
  name: string;
  level: "bad" | "fair" | "good" | "danger";
};
export type DrillRow = {
  name: string;
  v: number;
  /** Planned on top of `v` (hatched after it). */
  plan?: number;
  t?: number;
  ranges?: DrillRange[];
  color: string;
  /** The value as written beside the bar, when it differs from the axis («180,5 g»). */
  label?: string;
  /** The judgement word («ok», «pessimo»). */
  word?: string;
  /** Opens one level down (drawn as «›»). */
  opens?: boolean;
};

const STEP: Record<DrillRange["level"], number> = {
  danger: 6,
  bad: 10,
  fair: 20,
  good: 32,
};
const TINT: Record<DrillRange["level"], string> = {
  danger: "var(--heat-danger)",
  bad: "var(--heat-bad)",
  fair: "var(--heat-fair)",
  good: "var(--heat-good)",
};
const pc = (x: number, of: number) => Math.max(0, Math.min(100, (x / of) * 100)) + "%";

/** Round ticks for an axis: about four, at 1 · 2 · 2,5 · 5 × 10ⁿ. */
export function niceTicks(max: number, count = 4): { ticks: number[]; top: number } {
  const raw = max / count;
  const p = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? p * 10;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let x = 0; x <= top + step / 1e6; x += step) ticks.push(Math.round(x * 1e6) / 1e6);
  return { ticks, top };
}

function rangeSpans(ranges: DrillRange[], top: number) {
  return ranges.map((r, i) => ({ ...r, to: Math.min(top, ranges[i + 1]?.from ?? top) }));
}

/** The bar itself: ranges behind, the fill, the plan, the target tick. */
function Track({
  row,
  top,
  look,
  grid = [],
  line,
}: {
  row: DrillRow;
  top: number;
  look: "tint" | "grey";
  grid?: number[];
  line?: number | undefined;
}) {
  return (
    <span className={"k-dr-track " + look}>
      {grid.map((g) => (
        <span key={"g" + g} className="gl" style={{ left: pc(g, top) }} />
      ))}
      {rangeSpans(row.ranges ?? [], top).map((r, i) => (
        <span
          key={i}
          className={"band " + r.level}
          style={
            {
              left: pc(r.from, top),
              width: pc(r.to - r.from, top),
              "--band": TINT[r.level],
              "--step": STEP[r.level] + "%",
            } as CSSProperties
          }
        >
          {look === "tint" && <span className="nm">{r.name}</span>}
        </span>
      ))}
      <i className="fill" style={{ width: pc(row.v, top), background: row.color }} />
      {row.plan ? (
        <i
          className="plan"
          style={{ left: pc(row.v, top), width: pc(row.plan, top), color: row.color }}
        />
      ) : null}
      {row.t !== undefined && <span className="tick" style={{ left: pc(row.t, top) }} />}
      {line !== undefined && <span className="tl" style={{ left: pc(line, top) }} />}
    </span>
  );
}

/** Numbers under a bar: either round ticks, or the range edges and the target. */
function Axis({
  marks,
  top,
  unit,
  strong,
}: {
  marks: number[];
  top: number;
  unit?: string;
  strong?: number;
}) {
  // keep a number only when it is far enough from the last one kept (the target always wins)
  const sorted = marks.filter((m) => m >= 0 && m <= top).sort((a, b) => a - b);
  const shown: number[] = [];
  for (const m of sorted) {
    const last = shown[shown.length - 1];
    if (last === undefined || (m - last) / top > 0.16) shown.push(m);
    else if (m === strong) shown[shown.length - 1] = m;
  }
  return (
    <span className="k-dr-axis">
      {shown.map((m) => (
        <span
          key={m}
          className={
            [m === strong && "strong", m / top > 0.92 && "end"]
              .filter(Boolean)
              .join(" ") || undefined
          }
          style={{ left: pc(m, top) }}
        >
          {F.n(m, m < 10 && m % 1 ? 1 : 0)}
        </span>
      ))}
      {unit && <b className="unit">{unit}</b>}
    </span>
  );
}

/** A · Schede: one card, one bullet, its range names on the bar, its edges as the scale. */
export function DrillCard({
  row,
  unit,
  targetWord,
}: {
  row: DrillRow;
  unit: string;
  /** «obiettivo» — written beside the target's number. */
  targetWord: string;
}) {
  const ends = (row.ranges ?? []).map((r) => r.from);
  const far = Math.max(row.v + (row.plan ?? 0), row.t ?? 0, ...ends);
  const top = far * 1.12;
  return (
    <div className="k-dr-card" role="img" aria-label={a11y(row, unit, targetWord)}>
      <span className="head">
        <span className="nm">{row.name}</span>
        <b className="v">{row.label ?? F.num(row.v, unit)}</b>
        {row.word && <span className="w">{row.word}</span>}
        {row.opens && <span className="go">›</span>}
      </span>
      <Track row={row} top={top} look="tint" />
      <Axis
        marks={[0, ...ends, ...(row.t !== undefined ? [row.t] : [])]}
        top={top}
        unit={unit}
        {...(row.t !== undefined ? { strong: row.t } : {})}
      />
    </div>
  );
}

/** B · Grafico a livelli: rows on one shared axis, ranges in grey steps behind each bar. */
export function DrillChart({
  rows,
  unit,
  max,
  targetLine,
}: {
  rows: DrillRow[];
  /** The axis' unit («kcal», «g», «% dell'obiettivo»). */
  unit: string;
  max?: number;
  /** One target for every row, drawn as a line across the chart. */
  targetLine?: number;
}) {
  const far = max ?? Math.max(...rows.map((r) => r.v + (r.plan ?? 0)), targetLine ?? 0);
  const { ticks, top } = niceTicks(far);
  return (
    <div
      className="k-dr-chart"
      role="img"
      aria-label={rows.map((r) => a11y(r, unit)).join("; ")}
    >
      {rows.map((r) => (
        <span key={r.name} className="row">
          <span className="nm">
            <i style={{ background: r.color }} />
            {r.name}
          </span>
          <Track row={r} top={top} look="grey" grid={ticks} line={targetLine} />
          <span className="v">
            {r.label ?? F.n(r.v, 0)}
            {r.opens && <span className="go">›</span>}
          </span>
        </span>
      ))}
      <span className="row axisrow">
        <span />
        <Axis marks={ticks} top={top} />
        <b className="unit">{unit}</b>
      </span>
    </div>
  );
}

/** The legend of the grey steps, once per chart. */
export function DrillLegend({
  items,
}: {
  items: { name: string; level: DrillRange["level"] }[];
}) {
  return (
    <span className="k-dr-legend">
      {items.map((i) => (
        <span key={i.name}>
          <i
            className={"band " + i.level}
            style={{ "--step": STEP[i.level] + "%" } as CSSProperties}
          />
          {i.name}
        </span>
      ))}
    </span>
  );
}

/** Where we are, and the way back up («Energia › Proteine»). */
export function DrillPath({ steps, label }: { steps: string[]; label: string }) {
  return (
    <nav className="k-dr-path" aria-label={label}>
      {steps.map((s, i) => (
        <span key={s} className={i === steps.length - 1 ? "here" : undefined}>
          {i > 0 && <span className="sep">›</span>}
          {s}
        </span>
      ))}
    </nav>
  );
}

/** C · a face of the cube: the same chart, turned while it changes dimension. */
export function DrillFace({
  turn = 0,
  children,
}: {
  turn?: number;
  children: ReactNode;
}) {
  return (
    <div className="k-dr-cube">
      <div
        className={"face" + (turn ? " turning" : "")}
        style={{ "--turn": turn + "deg" } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

function a11y(r: DrillRow, unit: string, targetWord?: string) {
  return (
    r.name +
    " " +
    (r.label ?? F.num(r.v, unit)) +
    (r.plan ? " → " + F.num(r.v + r.plan, unit) : "") +
    (r.t !== undefined ? ", " + (targetWord ?? "") + " " + F.num(r.t, unit) : "") +
    (r.word ? ", " + r.word : "") +
    (r.ranges?.length
      ? " (" + r.ranges.map((x) => x.name + " da " + F.n(x.from, 0)).join(", ") + ")"
      : "")
  );
}
