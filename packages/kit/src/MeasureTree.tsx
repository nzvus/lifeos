/**
 * MeasureTree (bars study §7, his 20 Nov: «alcune metriche sono aggregati che contribuiscono ad
 * altri valori sommari che vanno visualizzati anch'essi… densità informativa»): a prototype of the
 * one construct for every bar. A node is a bullet (Few): its zones as the background in steps of
 * one hue, the actual solid, the plan outlined after it (IBCS, VIS-22), the target tick, the mark
 * at its end. Its children sit under it: if they add up to it, as an icicle tier on its scale
 * (each as wide as its share, or as its maximum, filled to what it got); if not, as a strip of
 * equal cells, each its own judgement. Over days, the same node is a row of word-sized columns.
 */
import type { CSSProperties } from "react";
import { F } from "./format";
import { heatLevel, type HeatZone } from "./nutrient-rows";

export type MNode = {
  name: string;
  /** A short name for a cell («B12», «Ca»). */
  short?: string;
  v: number;
  /** Planned on top of `v` (outlined after the actual). */
  plan?: number;
  /** For a child that adds up with a ceiling of its own (a criterion's weight in points). */
  max?: number;
  t?: number;
  unit?: string;
  zones?: HeatZone[];
  color: string;
  /** Its value written as the page wants («3.478 / 2.105 kcal», «71»). */
  label?: string;
  /** How its children relate to it: they add up, or each is judged alone. */
  children?: { adds: boolean; nodes: MNode[] };
};

const STEP: Record<string, number> = { danger: 4, bad: 7, fair: 12, good: 20 };
const MARK: Record<string, string> = {
  good: "met",
  fair: "part",
  bad: "no",
  danger: "no",
};

function scaleOf(n: MNode) {
  return Math.max((n.v + (n.plan ?? 0)) * 1.05, (n.t ?? n.v) * 1.3, n.max ?? 0, 1);
}
const pc = (x: number, of: number) => Math.max(0, Math.min(100, (x / of) * 100));

function Bullet({ n, scale }: { n: MNode; scale: number }) {
  const level = n.zones ? (heatLevel(n.v + (n.plan ?? 0), n.zones) ?? "fair") : null;
  const bands = (n.zones ?? []).map((z, i, a) => {
    const from = Math.min(z.from, scale);
    const to = Math.min(scale, a[i + 1]?.from ?? scale);
    return {
      left: pc(from, scale),
      w: pc(to - from, scale),
      step: STEP[z.level] ?? 10,
      danger: z.level === "danger",
    };
  });
  return (
    <span className="k-tb">
      {bands.map((b, i) => (
        <span
          key={i}
          className={"band" + (b.danger ? " danger" : "")}
          style={
            {
              left: b.left + "%",
              width: b.w + "%",
              "--step": b.step + "%",
            } as CSSProperties
          }
        />
      ))}
      <i className="act" style={{ width: pc(n.v, scale) + "%", background: n.color }} />
      {n.plan ? (
        <i
          className="plan"
          style={{
            left: pc(n.v, scale) + "%",
            width: pc(n.plan, scale) + "%",
            color: n.color,
          }}
        />
      ) : null}
      {n.t !== undefined && (
        <span className="tick" style={{ left: pc(n.t, scale) + "%" }} />
      )}
      {level && (
        <span
          className={"end k-st " + MARK[level]}
          style={{ left: pc(n.v + (n.plan ?? 0), scale) + "%" }}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

/** Children that add up: an icicle tier on the parent's scale. */
function Tier({ nodes, scale }: { nodes: MNode[]; scale: number }) {
  return (
    <span className="k-tt">
      {nodes.map((c) => {
        const w = pc(c.max ?? c.v, scale);
        const got = c.max ? pc(c.v, c.max) : 100;
        const level = c.zones ? heatLevel(c.v, c.zones) : null;
        return (
          <span
            key={c.name}
            className="seg"
            style={
              { width: w + "%", "--c": c.color, "--got": got + "%" } as CSSProperties
            }
            title={c.name}
          >
            <i />
            <span className="lb">
              {level && <span className={"k-st " + MARK[level]} aria-hidden="true" />}
              {c.short ?? c.name}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Children judged alone: one equal cell each, its judgement as its fill. */
function Cells({ nodes }: { nodes: MNode[] }) {
  return (
    <span className="k-tc">
      {nodes.map((c) => {
        const level = c.zones
          ? (heatLevel(c.v + (c.plan ?? 0), c.zones) ?? "fair")
          : "fair";
        return (
          <span
            key={c.name}
            className={"cell " + MARK[level] + (c.plan ? " planned" : "")}
            style={{ "--c": c.color } as CSSProperties}
          >
            <i />
            <span className="lb">{c.short ?? c.name}</span>
          </span>
        );
      })}
    </span>
  );
}

/** Style samples (bars study §9, his 20 Nov «non me li fai vedere»): one structure, three skins. */
export type TreeSkin = "pieno" | "calmo" | "denso";

export function MeasureTree({
  node,
  depth = 2,
  skin,
}: {
  node: MNode;
  depth?: number;
  skin?: TreeSkin;
}) {
  const scale = node.max ?? scaleOf(node);
  const kids = node.children;
  const aria =
    node.name +
    ": " +
    (node.label ?? F.num(node.v, node.unit ?? "")) +
    (kids
      ? ", " + kids.nodes.map((c) => c.name + " " + (c.label ?? F.n(c.v, 0))).join(", ")
      : "");
  return (
    <div
      className={"k-tree" + (skin ? " skin-" + skin : "")}
      role="img"
      aria-label={aria}
    >
      <span className="k-thead">
        <span className="nm">{node.name}</span>
        <b className="n">{node.label ?? F.num(node.v, node.unit ?? "")}</b>
      </span>
      <Bullet n={node} scale={scale} />
      {kids &&
        depth > 0 &&
        (kids.adds ? (
          <Tier nodes={kids.nodes} scale={scale} />
        ) : (
          <Cells nodes={kids.nodes} />
        ))}
    </div>
  );
}

/** The same node over days: word-sized columns on its zones (Andamento). */
export function MeasureDays({
  name,
  days,
  t,
  zones,
  color,
  label,
}: {
  name: string;
  days: { d: string; v: number; plan?: number }[];
  t: number;
  zones: HeatZone[];
  color: string;
  label: string;
}) {
  const scale = Math.max(t * 1.3, ...days.map((x) => (x.v + (x.plan ?? 0)) * 1.05));
  return (
    <div className="k-tree" role="img" aria-label={name + ": " + label}>
      <span className="k-thead">
        <span className="nm">{name}</span>
        <b className="n">{label}</b>
      </span>
      <span className="k-tdays">
        {days.map((x) => {
          const level = heatLevel(x.v + (x.plan ?? 0), zones) ?? "fair";
          return (
            <span key={x.d} className="day">
              <span className="col">
                <span className="tick" style={{ bottom: pc(t, scale) + "%" }} />
                <i style={{ height: pc(x.v, scale) + "%", background: color }} />
                {x.plan ? (
                  <i
                    className="plan"
                    style={{
                      bottom: pc(x.v, scale) + "%",
                      height: pc(x.plan, scale) + "%",
                      color,
                    }}
                  />
                ) : null}
              </span>
              <span className={"k-st " + MARK[level]} aria-hidden="true" />
              <span className="lb">{x.d}</span>
            </span>
          );
        })}
      </span>
    </div>
  );
}
