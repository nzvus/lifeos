import { describe, expect, it } from "vitest";
import { nutrientsL1 as rows, shade, type NutrientsData } from "./nutrient-rows";

/** F writes a no-break space between a number and its unit; the cases read plain. */
const nutrientsL1 = (d: NutrientsData) =>
  JSON.parse(JSON.stringify(rows(d)).replace(/\u00a0/g, " ")) as ReturnType<typeof rows>;

describe("Nutrients L1", () => {
  it("draws kcal against the target, the planned part inside the track", () => {
    const { kcal } = nutrientsL1({
      kcal: { v: 1738, planned: 262, t: 2090 },
      macros: [],
    });
    expect(kcal).toMatchObject({
      v: "1.738",
      t: "2.090 kcal",
      left: "+262 kcal previste",
      bar: { w: "83.2%", pw: "12.5%" },
    });
    const over = nutrientsL1({ kcal: { v: 2200, planned: 300, t: 2000 }, macros: [] });
    expect(over.kcal?.bar).toEqual({ w: "100.0%", pw: "0.0%" });
  });

  it("has no bar and no target without a target", () => {
    const { kcal, macros } = nutrientsL1({
      kcal: { v: 900 },
      macros: [{ key: "protein", v: 50.25 }],
    });
    expect(kcal).toMatchObject({ t: null, bar: null, aria: "Energia: 900 kcal" });
    expect(macros[0]).toMatchObject({ value: "50,3", target: null, mark: null });
    expect(macros[0]!.segs).toEqual([
      { w: "95.2%", bg: shade("protein", 1), planned: false },
    ]);
  });

  it("puts the tick at the target on a scale with room past it, planned hatched", () => {
    const [m] = nutrientsL1({
      macros: [{ key: "carbs", v: 100, planned: 20, t: 200 }],
    }).macros;
    // scale = max(200 × 1,25, 120 × 1,05) = 250
    expect(m!.mark).toBe("80.0%");
    expect(m!.segs.map((s) => [s.w, s.planned])).toEqual([
      ["40.0%", false],
      ["8.0%", true],
    ]);
    expect(m!.aria).toBe("Carboidrati 100 g su 200 g, 20 g previsti");
  });

  it("shades by kind in the fixed order, and lists five sources then the rest", () => {
    const [m] = nutrientsL1({
      macros: [
        {
          key: "protein",
          v: 30,
          t: 40,
          parts: { low: 10, high: 20 },
          sources: [
            ["A", 10],
            ["B", 8],
            ["C", 5],
            ["D", 3],
            ["E", 2],
            ["F", 1.5],
            ["G", 0.5],
          ],
        },
      ],
    }).macros;
    expect(m!.kinds.map((k) => k.name)).toEqual(["qualità alta", "qualità bassa"]);
    expect(m!.segs.map((s) => s.bg)).toEqual([
      shade("protein", 1),
      shade("protein", 0.3),
    ]);
    expect(m!.sources.map((s) => [s.name, s.g, s.w])).toEqual([
      ["A", "10", "100%"],
      ["B", "8", "80%"],
      ["C", "5", "50%"],
      ["D", "3", "30%"],
      ["E", "2", "20%"],
      ["e altri 2", "2", "0%"],
    ]);
  });

  it("judges the maxima as ceilings", () => {
    const { limits } = nutrientsL1({
      macros: [],
      limits: [
        { key: "sugars", v: 78, t: 94 },
        { key: "salt", v: 6, t: 5 },
        { key: "sat", v: 9.6, t: 23 },
      ],
    });
    expect(limits.map((l) => [l.v, l.t, l.w, l.color])).toEqual([
      ["78", "94 g", "83%", "var(--herb)"],
      ["6", "5 g", "100%", "var(--tomato)"],
      ["9,6", "23 g", "42%", "var(--herb)"],
    ]);
  });
});
