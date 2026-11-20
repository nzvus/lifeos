/**
 * MeasureView (MOD-56, PAT-52): draws a view the visualization engine gave — a page never
 * picks the drawing, it asks the engine with its frame and level and hands the view here. Each
 * piece is an existing kit piece: a bar with its parts (MeasureTree), a column a day
 * (MeasureDays), the judgement chip (Judge), «non so» (Unknown). The kit knows no type: the
 * spec is plain data (names, numbers, tokens).
 */
import { Judge } from "./Fascia";
import { F } from "./format";
import { MeasureDays, MeasureTree, type MNode } from "./MeasureTree";
import type { HeatZone } from "./nutrient-rows";
import { Unknown } from "./Unknown";
import { WORDS } from "./words";

type SpecNode = Omit<MNode, "label" | "children"> & {
  children?: { adds: boolean; nodes: SpecNode[] };
};
type Lv = 0 | 1 | 2;

export type MeasureViewSpec =
  | { piece: "tree"; level: Lv; node: SpecNode; depth: number }
  | {
      piece: "days";
      level: Lv;
      name: string;
      unit?: string;
      days: { d: string; v: number; plan?: number }[];
      t?: number;
      zones: HeatZone[];
      color: string;
    }
  | { piece: "chip"; level: Lv; name: string; score: number }
  | { piece: "unknown"; level: Lv; name: string; missing: string[] }
  | { piece: "none"; reason: string };

/** The value as written beside its bar: «1.750 / 2.500 ml», or «1.750 ml» with no target. */
export function measureLabel(n: Pick<MNode, "v" | "plan" | "t" | "unit">): string {
  const u = n.unit ?? "";
  const to = n.v + (n.plan ?? 0);
  const done = n.plan ? F.num(n.v) + " → " : "";
  if (n.t !== undefined) return done + F.of(to, n.t, u);
  return done + F.num(to, u);
}

const withLabels = (n: SpecNode): MNode => ({
  ...n,
  label: measureLabel(n),
  ...(n.children
    ? { children: { adds: n.children.adds, nodes: n.children.nodes.map(withLabels) } }
    : {}),
});

function mean(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function MeasureView({ view }: { view: MeasureViewSpec }) {
  switch (view.piece) {
    case "none":
      return null;
    case "unknown":
      return (
        <div className="k-thead">
          <span className="nm">{view.name}</span>
          <Unknown missing={view.missing} />
        </div>
      );
    case "chip":
      return (
        <div className="k-thead">
          <span className="nm">{view.name}</span>
          <Judge score={view.score} />
        </div>
      );
    case "days":
      return (
        <MeasureDays
          name={view.name}
          days={view.days}
          zones={view.zones}
          color={view.color}
          {...(view.t !== undefined ? { t: view.t } : {})}
          label={
            WORDS.mean + " " + F.num(mean(view.days.map((x) => x.v)), view.unit ?? "")
          }
        />
      );
    case "tree":
      return <MeasureTree node={withLabels(view.node)} depth={view.depth} />;
  }
}
