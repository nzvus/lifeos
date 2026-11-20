import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MeasureView, measureLabel } from "./MeasureView";

const zones = [
  { from: 0, level: "bad" as const },
  { from: 2300, level: "good" as const },
];
const html = (v: Parameters<typeof MeasureView>[0]["view"]) =>
  renderToStaticMarkup(<MeasureView view={v} />);

// MOD-56: the kit draws what the engine gave, with its existing pieces (PAT-52).
describe("MeasureView draws an engine view (PAT-52, MOD-56)", () => {
  const node = {
    name: "Acqua",
    v: 1750,
    t: 2500,
    unit: "ml",
    color: "var(--ink)",
    zones,
    children: { adds: true, nodes: [{ name: "08:10", v: 500, color: "var(--ink)" }] },
  };

  it("a bar with its value against the target; its parts only when the depth allows", () => {
    const l0 = html({ piece: "tree", level: 0, node, depth: 0 });
    expect(l0).toMatch(/1\.750\s\/\s2\.500/);
    expect(l0).not.toContain("k-tt");
    expect(html({ piece: "tree", level: 1, node, depth: 1 })).toContain("k-tt");
  });

  it("a period as a column a day with its mean; a score as the chip; «non so»; nothing", () => {
    const days = html({
      piece: "days",
      level: 0,
      name: "Acqua",
      unit: "ml",
      days: [
        { d: "lu", v: 2000 },
        { d: "ma", v: 1500 },
      ],
      zones,
      color: "var(--ink)",
    });
    expect(days).toContain("media 1.750");
    expect(days).not.toContain('class="tick"');
    expect(html({ piece: "chip", level: 0, name: "Voto", score: 71 })).toContain(
      "k-judge",
    );
    expect(
      html({ piece: "unknown", level: 0, name: "Sonno", missing: ["la notte"] }),
    ).toContain("non so");
    expect(html({ piece: "none", reason: "no-data" })).toBe("");
  });

  it("writes a plan as «fatto → con il previsto», decimals by unit", () => {
    expect(measureLabel({ v: 6.6, t: 8, unit: "h" })).toMatch(/6,6\s\/\s8/);
    expect(measureLabel({ v: 1450, plan: 650, t: 2105, unit: "kcal" })).toMatch(
      /1\.450 → 2\.100\s\/\s2\.105/,
    );
  });
});

// Bars-study §19 (his 20 Nov, «yc»): yes / no for any class; no dots on bars and columns.
describe("Done: yes / no in the voce's own shape, and no dots (VIS-22, MOD-56)", () => {
  const W = ["lu", "ma", "me"];
  it("a day is one cell in its state, named for a screen reader", () => {
    const h = html({
      piece: "state",
      level: 0,
      name: "Creatina",
      state: "planned",
      color: "x",
    });
    expect(h).toContain('class="cell planned"');
    expect(h).toContain('aria-label="previsto"');
  });

  it("a week labels its days; a goal does not; a streak is said from three", () => {
    const cells = W.map((d) => ({ d, s: "done" as const }));
    const week = html({
      piece: "cells",
      level: 0,
      name: "C",
      grid: "week",
      cells,
      streak: 3,
      color: "x",
      lead: 0,
    });
    expect(week).toContain(">lu<");
    expect(week).toContain("3 di fila");
    const goal = html({
      piece: "cells",
      level: 0,
      name: "G",
      grid: "goal",
      cells,
      streak: 2,
      color: "x",
      lead: 0,
    });
    expect(goal).not.toContain(">lu<");
    expect(goal).not.toContain("di fila");
    expect(goal).toContain("fatto 3 su 3");
  });

  it("a month starts on its weekday", () => {
    const m = html({
      piece: "cells",
      level: 0,
      name: "C",
      grid: "month",
      cells: [{ d: "1", s: "done" }],
      streak: 1,
      color: "x",
      lead: 6,
    });
    expect(m.match(/class="blank"/g)).toHaveLength(6);
  });

  it("bars and day columns carry no judgement dot", () => {
    const node = {
      name: "A",
      v: 1,
      t: 2,
      color: "x",
      zones: [{ from: 0, level: "bad" as const }],
    };
    expect(html({ piece: "tree", level: 0, node, depth: 0 })).not.toContain("k-st");
    const days = html({
      piece: "days",
      level: 0,
      name: "A",
      days: [{ d: "lu", v: 1 }],
      zones: node.zones,
      color: "x",
    });
    expect(days).not.toContain("k-st");
    expect(days).toContain('class="band"');
  });
});
