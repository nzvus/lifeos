import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DrillCard, DrillChart, DrillPath, niceTicks } from "./Drill";

// Bars study §12 (his 20 Nov): the scale, the ranges and the target written (VIS-50, VIS-52).
const ranges = [
  { from: 0, level: "bad" as const, name: "pessimo" },
  { from: 63, level: "fair" as const, name: "ok" },
  { from: 121, level: "good" as const, name: "ottimo" },
  { from: 167, level: "fair" as const, name: "ok" },
];
const row = { name: "Proteine", v: 180.5, t: 168, color: "p", ranges, word: "ok" };

describe("drill proposals: a written scale, named ranges, a path back up (VIS-50, VIS-52)", () => {
  it("round ticks at 1 · 2 · 2,5 · 5 × 10ⁿ", () => {
    expect(niceTicks(3478)).toEqual({ ticks: [0, 1000, 2000, 3000, 4000], top: 4000 });
    expect(niceTicks(96.2).ticks).toEqual([0, 25, 50, 75, 100]);
  });
  it("a card names each range on the bar and writes its edges and the target", () => {
    const h = renderToStaticMarkup(
      <DrillCard row={row} unit="g" targetWord="obiettivo" />,
    );
    expect(h).toContain(">ottimo<");
    expect(h).toMatch(/class="strong"[^>]*>168</);
    expect(h).toContain(">63<");
    expect(h).toContain(">g<");
    expect(h).toContain("obiettivo 168");
  });
  it("a chart shares one axis, writes its unit once, and a shared target line", () => {
    const h = renderToStaticMarkup(
      <DrillChart
        rows={[row, { name: "Fibre", v: 46.7, color: "f" }]}
        unit="%"
        targetLine={100}
      />,
    );
    expect(h.match(/class="unit"/g)).toHaveLength(1);
    expect(h.match(/class="tl"/g)).toHaveLength(2);
    expect(h).toContain("Fibre");
  });
  it("the path ends where we are", () => {
    const h = renderToStaticMarkup(
      <DrillPath label="p" steps={["Energia", "Proteine"]} />,
    );
    expect(h).toContain('class="here">');
    expect(h).toContain("›");
  });
});
