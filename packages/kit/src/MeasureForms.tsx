/**
 * Style samples, round 2 (bars study §9 rules 1–7; his 20 Nov: «nemmeno mi piacciono» on pieno ·
 * calmo · denso, which were one structure in three skins). Each sample changes the main channel,
 * not the skin; all three draw the same MNode and keep the grammar: hue = what it is, length on a
 * shared scale = how much, where it ends among the zones + the mark = how it is judged, hatch =
 * planned, the total beside its parts, one number per block (units once, in the header).
 *
 *   colonne   — a block is one small column chart: the total as a stacked column, its parts beside
 *               it, each on its own zones, the target one line across.
 *   quadretti — the same in steps of 20 % of the target: counted, not measured.
 *   rosa      — a block is one polar shape: a wedge per part, the target a circle, the total the
 *               ring in the middle.
 */
import { useId, type CSSProperties, type ReactNode } from "react";
import { F } from "./format";
import { heatLevel, type HeatZone } from "./nutrient-rows";
import type { MNode } from "./MeasureTree";

export type FormStyle = "colonne" | "quadretti" | "rosa";

type Mark = "met" | "part" | "no";
const MARKS: Record<string, Mark> = {
  good: "met",
  fair: "part",
  bad: "no",
  danger: "no",
};
const mark = (level: string): Mark => MARKS[level] ?? "part";
const STEP: Record<string, number> = { danger: 3, bad: 6, fair: 11, good: 18 };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** The target of a node: its own, or its maximum (points), or the middle of its «good» zone. */
function targetOf(n: MNode): number {
  if (n.t !== undefined) return n.t;
  if (n.max !== undefined) return n.max;
  const zs = n.zones ?? [];
  const i = zs.findIndex((z) => z.level === "good");
  if (i < 0) return n.v || 1;
  const from = zs[i]!.from;
  const to = zs[i + 1]?.from ?? from * 1.5;
  return (from + to) / 2;
}
/** Points fill to their maximum; amounts run to twice their target. */
const scaleOf = (n: MNode) => (n.max !== undefined ? n.max : targetOf(n) * 2);
const levelOf = (n: MNode, v = n.v + (n.plan ?? 0)) =>
  n.zones?.length ? (heatLevel(v, n.zones) ?? "fair") : "good";
const zoneAt = (zones: HeatZone[] | undefined, v: number) =>
  zones?.length ? (heatLevel(v, zones) ?? "fair") : null;

function bands(n: MNode, scale: number) {
  return (n.zones ?? []).map((z, i, a) => {
    const from = clamp01(z.from / scale);
    const to = clamp01((a[i + 1]?.from ?? scale) / scale);
    return { from, to, level: z.level };
  });
}

function Head({ node, number }: { node: MNode; number?: string | undefined }) {
  return (
    <span className="k-mf-head">
      <span className="nm">{node.name}</span>
      <b className="n">{number ?? node.label ?? F.n(node.v, 0)}</b>
    </span>
  );
}

function aria(node: MNode, number?: string) {
  const kids = node.children?.nodes ?? [];
  const val = (c: MNode) =>
    c.label ??
    F.num(c.v, c.unit ?? "") + (c.plan ? " → " + F.num(c.v + c.plan, c.unit ?? "") : "");
  return (
    node.name +
    ": " +
    (number ?? val(node)) +
    (kids.length ? ", " + kids.map((c) => c.name + " " + val(c)).join(", ") : "")
  );
}

/* ---------------------------------- colonne ---------------------------------- */

function Column({ n, total }: ColProps) {
  const scale = scaleOf(n);
  const t = clamp01(targetOf(n) / scale);
  const act = clamp01(n.v / scale);
  const plan = clamp01((n.v + (n.plan ?? 0)) / scale) - act;
  const over = n.v + (n.plan ?? 0) > scale;
  const kids = n.children?.nodes ?? [];
  let acc = 0;
  return (
    <span className={"col" + (total ? " tot" : "") + (over ? " over" : "")}>
      {(total === "count" ? [] : bands(n, scale)).map((b, i) => (
        <span
          key={i}
          className={"band" + (b.level === "danger" ? " danger" : "")}
          style={
            {
              bottom: b.from * 100 + "%",
              height: (b.to - b.from) * 100 + "%",
              "--step": (STEP[b.level] ?? 10) + "%",
            } as CSSProperties
          }
        />
      ))}
      {total === "count"
        ? kids.map((c, i) => (
            <i
              key={c.name}
              className={"cnt " + mark(levelOf(c))}
              style={
                {
                  bottom: (i / kids.length) * 100 + "%",
                  height: `calc(${100 / kids.length}% - 2px)`,
                  "--c": c.color,
                } as CSSProperties
              }
            />
          ))
        : total
          ? [
              ...total.map((c) => ({ c, v: c.v, cls: "act" })),
              ...total.map((c) => ({ c, v: c.plan ?? 0, cls: "plan" })),
            ].map(({ c, v, cls }) => {
              const h = Math.min(clamp01(v / scale), 1 - acc);
              const el =
                h > 0 ? (
                  <i
                    key={cls + c.name}
                    className={cls}
                    style={{
                      bottom: acc * 100 + "%",
                      height: h * 100 + "%",
                      background: cls === "act" ? c.color : undefined,
                      color: c.color,
                    }}
                  />
                ) : null;
              acc += h;
              return el;
            })
          : [
              <i
                key="a"
                className="act"
                style={{ bottom: 0, height: act * 100 + "%", background: n.color }}
              />,
              plan > 0 ? (
                <i
                  key="p"
                  className="plan"
                  style={{
                    bottom: act * 100 + "%",
                    height: plan * 100 + "%",
                    color: n.color,
                  }}
                />
              ) : null,
            ]}
      {n.max === undefined && <span className="tick" style={{ bottom: t * 100 + "%" }} />}
      <span
        className={"end k-st " + mark(levelOf(n))}
        style={{ bottom: clamp01((n.v + (n.plan ?? 0)) / scale) * 100 + "%" }}
        aria-hidden="true"
      />
    </span>
  );
}

type ColProps = { n: MNode; total?: MNode[] | "count" };

/** A total, then one column per part, their names under them (colonne and quadretti). */
function ColBlock({
  node,
  cls,
  Col,
}: {
  node: MNode;
  cls: string;
  Col: (p: ColProps) => ReactNode;
}) {
  const kids = node.children?.nodes ?? [];
  return (
    <span className={cls} style={{ "--n": kids.length } as CSSProperties}>
      <span className="plot">
        <Col n={node} total={node.children?.adds ? kids : "count"} />
        {kids.map((c) => (
          <Col key={c.name} n={c} />
        ))}
      </span>
      <span className="lbs">
        <span />
        {kids.map((c) => (
          <span key={c.name}>{c.short ?? c.name}</span>
        ))}
      </span>
    </span>
  );
}

/* --------------------------------- quadretti --------------------------------- */

/** Steps of 20 % of the target (or of the maximum, for points). */
function Pips({ n, total }: ColProps) {
  const scale = scaleOf(n);
  const count = n.max !== undefined ? 5 : 10;
  const step = scale / count;
  const tIndex = Math.round(targetOf(n) / step); // the pip boundary of the target
  const kids = n.children?.nodes ?? [];
  // for a total that adds up: which part covers each pip's middle
  const cum: { to: number; c: MNode }[] = [];
  if (Array.isArray(total)) {
    let s = 0;
    for (const c of total) cum.push({ to: (s += c.v), c });
  }
  const pips =
    total === "count"
      ? kids.map((c) => ({
          key: c.name,
          cls: "cnt " + mark(levelOf(c)),
          style: { "--c": c.color } as CSSProperties,
        }))
      : Array.from({ length: count }, (_, i) => {
          const lo = i * step;
          const mid = lo + step / 2;
          const got = clamp01((n.v - lo) / step);
          const planned = clamp01((n.v + (n.plan ?? 0) - lo) / step) - got;
          const part = cum.find((x) => mid <= x.to)?.c;
          const color = Array.isArray(total) ? (part?.color ?? n.color) : n.color;
          const zl = zoneAt(n.zones, mid);
          return {
            key: String(i),
            cls:
              "pip" +
              (i === tIndex - 1 && n.max === undefined ? " t" : "") +
              (zl === "danger" ? " danger" : ""),
            style: {
              "--c": color,
              "--got": got * 100 + "%",
              "--plan": (got + planned) * 100 + "%",
              "--step": (STEP[zl ?? "fair"] ?? 10) + "%",
            } as CSSProperties,
          };
        });
  return (
    <span className={"pcol" + (total ? " tot" : "")}>
      {pips.map((p) => (
        <i key={p.key} className={p.cls} style={p.style} />
      ))}
      <span className={"k-st " + mark(levelOf(n))} aria-hidden="true" />
    </span>
  );
}

/* ------------------------------------ rosa ----------------------------------- */

const C = 80; // centre of the 160 × 160 drawing
const R0 = 24; // where the wedges start (inside: the total)
const R1 = 64; // the end of the scale
const rad = (f: number) => R0 + clamp01(f) * (R1 - R0);
function arc(r0: number, r1: number, a0: number, a1: number) {
  const p = (r: number, a: number) =>
    `${(C + r * Math.sin(a)).toFixed(2)} ${(C - r * Math.cos(a)).toFixed(2)}`;
  const big = a1 - a0 > Math.PI ? 1 : 0;
  return `M${p(r0, a0)}L${p(r1, a0)}A${r1} ${r1} 0 ${big} 1 ${p(r1, a1)}L${p(r0, a1)}A${r0} ${r0} 0 ${big} 0 ${p(r0, a0)}Z`;
}
const MARK_FILL = { met: "var(--herb)", part: "var(--warn)", no: "var(--tomato)" };

function Rose({ node }: { node: MNode }) {
  const id = useId().replace(/:/g, "");
  const kids = node.children?.nodes ?? [];
  const adds = node.children?.adds;
  const n = kids.length || 1;
  const gap = 0.04;
  // the total: a ring in the middle, the full circle = its target (a second lap past it)
  const tScale = node.max ?? targetOf(node);
  let acc = 0;
  const ring: { a0: number; a1: number; color: string; cls?: string | undefined }[] = [];
  if (adds)
    for (const c of kids) {
      const a0 = (acc / tScale) * 2 * Math.PI;
      acc += c.v;
      ring.push({ a0, a1: (acc / tScale) * 2 * Math.PI, color: c.color });
    }
  else
    kids.forEach((c, i) =>
      ring.push({
        a0: (i / n) * 2 * Math.PI + 0.06,
        a1: ((i + 1) / n) * 2 * Math.PI - 0.06,
        color: c.color,
        cls: mark(levelOf(c)),
      }),
    );
  return (
    <svg className="k-mf-rose" viewBox="-14 -6 188 172" aria-hidden="true">
      <defs>
        {kids.map((c, i) => (
          <pattern
            key={i}
            id={`${id}h${i}`}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="2" height="4" style={{ fill: c.color }} />
          </pattern>
        ))}
      </defs>
      {kids.map((c, i) => {
        const a0 = (i / n) * 2 * Math.PI + gap;
        const a1 = ((i + 1) / n) * 2 * Math.PI - gap;
        const scale = scaleOf(c);
        const act = c.v / scale;
        const end = (c.v + (c.plan ?? 0)) / scale;
        const am = (a0 + a1) / 2;
        const lr = R1 + 9;
        const mk = mark(levelOf(c));
        const mr = rad(end);
        return (
          <g key={c.name}>
            {bands(c, scale).map((b, j) => (
              <path
                key={j}
                d={arc(rad(b.from), rad(b.to), a0, a1)}
                className={"band" + (b.level === "danger" ? " danger" : "")}
                style={{ "--step": (STEP[b.level] ?? 10) + "%" } as CSSProperties}
              />
            ))}
            <path d={arc(R0, rad(act), a0, a1)} style={{ fill: c.color }} />
            {end > act && (
              <path d={arc(rad(act), rad(end), a0, a1)} fill={`url(#${id}h${i})`} />
            )}
            {c.max === undefined && (
              <path
                d={arc(
                  rad(targetOf(c) / scale) - 0.75,
                  rad(targetOf(c) / scale) + 0.75,
                  a0,
                  a1,
                )}
                className="tick"
              />
            )}
            <circle
              cx={C + mr * Math.sin(am)}
              cy={C - mr * Math.cos(am)}
              r="3.5"
              className={"mk " + mk}
              style={{ "--m": MARK_FILL[mk] } as CSSProperties}
            />
            <text
              x={C + lr * Math.sin(am)}
              y={C - lr * Math.cos(am)}
              textAnchor="middle"
              dominantBaseline="central"
              className="lb"
            >
              {c.short ?? c.name}
            </text>
          </g>
        );
      })}
      {/* the total, in the middle */}
      <circle cx={C} cy={C} r={R0 - 7} className="hole" />
      {ring.map((s, i) => {
        const lap2 = s.a0 >= 2 * Math.PI;
        const a0 = lap2 ? s.a0 - 2 * Math.PI : s.a0;
        const a1 = Math.min(lap2 ? s.a1 - 2 * Math.PI : s.a1, 2 * Math.PI - 0.001);
        const r = lap2 ? R0 - 4 : R0 - 7;
        const w = lap2 ? 2 : 4;
        if (!lap2 && s.a1 > 2 * Math.PI) {
          // a part that crosses the target: its rest goes on the second lap
          return (
            <g key={i}>
              <path
                d={arc(r - w / 2, r + w / 2, a0, 2 * Math.PI - 0.001)}
                style={{ fill: s.color }}
              />
              <path
                d={arc(
                  R0 - 5,
                  R0 - 3,
                  0,
                  Math.min(s.a1 - 2 * Math.PI, 2 * Math.PI - 0.001),
                )}
                style={{ fill: s.color }}
              />
            </g>
          );
        }
        return (
          <path
            key={i}
            d={arc(r - w / 2, r + w / 2, a0, a1)}
            className={s.cls ? "cnt " + s.cls : undefined}
            style={{
              fill: s.cls === "no" ? "none" : s.color,
              stroke: s.cls ? s.color : undefined,
            }}
          />
        );
      })}
      <circle
        cx={C}
        cy={C}
        r="4"
        className={"mk " + mark(levelOf(node))}
        style={{ "--m": MARK_FILL[mark(levelOf(node))] } as CSSProperties}
      />
    </svg>
  );
}

/** One block (a total and its parts) in one of the sample forms. */
export function MeasureForm({
  node,
  form,
  number,
}: {
  node: MNode;
  form: FormStyle;
  /** The one number of the block («3.478 kcal»); the target is on the drawing. */
  number?: string;
}) {
  return (
    <div
      className={
        "k-mf k-mf-" + form + ((node.children?.nodes.length ?? 0) > 5 ? " wide" : "")
      }
      role="img"
      aria-label={aria(node, number)}
    >
      <Head node={node} number={number} />
      {form === "colonne" ? (
        <ColBlock node={node} cls="k-mf-cols" Col={Column} />
      ) : form === "quadretti" ? (
        <ColBlock node={node} cls="k-mf-pips" Col={Pips} />
      ) : (
        <Rose node={node} />
      )}
    </div>
  );
}
