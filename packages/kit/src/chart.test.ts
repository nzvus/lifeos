import { describe, expect, it } from "vitest";
import { chartGeometry } from "./Chart";

/** The board's own sample (Chart.dc.html): the same numbers come out. */
const SAMPLE = {
  x: ["8", "10", "12", "13", "14", "15"],
  y: [76.0, 76.6, 75.75, 75.2, 75.5, 75.6],
  trend: [76.0, 76.1, 75.9, 75.7, 75.62, 75.6],
  sd: 0.3,
  unit: "kg",
  goal: 72.3,
  goalText: "obiettivo 72,3",
  lo: 75,
  hi: 77,
};

describe("Chart", () => {
  it("draws the trend as the board does", () => {
    const g = chartGeometry("trend", SAMPLE);
    expect(g.H).toBe(170);
    expect(g.grid.map((x) => x.t)).toEqual(["76,5", "75,5"]);
    expect(g.pts[0]).toEqual({ x: "32.0", y: "79.0" });
    expect(g.pts[5]!.x).toBe("352.0");
    // A goal off the scale sits on its bottom edge.
    expect(g.goal?.y).toBe("150.0");
    expect(g.line?.startsWith("M32.0 79.0 L96.0 ")).toBe(true);
    expect(g.band?.endsWith(" Z")).toBe(true);
    expect(g.aria).toContain("trend da 76 a 75,6");
  });

  it("marks the bars under the band", () => {
    const g = chartGeometry("bars", {
      x: ["L", "M"],
      y: [6.5, 8],
      unit: "h",
      lo: 0,
      hi: 10,
      bandLo: 7,
      bandHi: 9,
    });
    expect(g.H).toBe(150);
    expect(g.bars.map((b) => b.warn)).toEqual([true, false]);
    expect(g.band).toMatch(/^M32 /);
    expect(g.pts).toEqual([]);
  });
});
