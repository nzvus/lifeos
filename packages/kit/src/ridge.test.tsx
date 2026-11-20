import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ridgeOf } from "./nutrient-rows";
import { Ridge } from "./Ridge";

// Bars study §15 (his 20 Nov «tu puoi fare di meglio»): the bar takes the shape of its ranges
// (VIS-50, VIS-52, VIS-22).
const m = (name: string, v: number, plan?: number) => ({
  icon: "protein",
  name,
  v,
  ...(plan ? { plan } : {}),
  t: 100,
  color: "c",
  ranges: [
    { from: 0, level: "bad" as const },
    { from: 50, level: "fair" as const },
    { from: 80, level: "good" as const },
    { from: 120, level: "fair" as const },
  ],
  n: String(v),
  label: v + " / 100 g",
});

describe("ridge: a hill per measure, its peak the target (VIS-50, VIS-52, VIS-22)", () => {
  const h = renderToStaticMarkup(
    <Ridge
      measures={[m("Proteine", 90), m("Fibre", 40, 30)]}
      unit="g"
      label="Il giorno"
    />,
  );
  it("a hill and its blended ranges per measure, one peak line for all", () => {
    expect(h.match(/class="zone"/g)).toHaveLength(2);
    expect(h.match(/<linearGradient/g)).toHaveLength(2);
    expect(h.match(/class="peakline"/g)).toHaveLength(1);
  });
  it("no range words; the edges as numbers, the unit once", () => {
    expect(h).not.toMatch(/>(ok|ottimo|pessimo)</);
    expect(h).toMatch(/>50</);
    expect(h.match(/class="unit"/g)).toHaveLength(1);
  });
  it("a plan hatched after the amount; every value for readers", () => {
    expect(h.match(/class="plan"/g)).toHaveLength(1);
    expect(h).toContain("Fibre 40 / 100 g");
  });
});

describe("ridgeOf: the day's hills, a meal lit inside them (bars study §16.4; VIS-50, VIS-52)", () => {
  const zones = [
    { from: 0, level: "bad" as const },
    { from: 50, level: "good" as const },
  ];
  const day = {
    kcal: { v: 2000, t: 2000, zones },
    macros: [
      { key: "protein" as const, v: 150, t: 160, zones },
      { key: "fiber" as const, v: 20, t: null },
    ],
    limits: [{ key: "salt" as const, v: 6, t: 5, zones }],
  };
  it("a hill for each measure with a target and zones; none without", () => {
    expect(ridgeOf(day).map((m) => m.icon)).toEqual(["kcal", "protein", "salt"]);
  });
  it("a meal: its share first in its colour, the rest of the day grey after it", () => {
    const meal = { kcal: { v: 500 }, macros: [{ key: "protein" as const, v: 40 }] };
    const p = ridgeOf(day, meal).find((m) => m.icon === "protein")!;
    expect(p.parts).toEqual([
      { v: 40, color: "var(--macro-protein)" },
      expect.objectContaining({ v: 110, dim: true }),
    ]);
    expect(p.label).toContain("questo pasto");
  });
  it("a share the meal does not carry (its limits) is all rest, never shown as the meal's", () => {
    const meal = { kcal: { v: 500 }, macros: [] };
    const salt = ridgeOf(day, meal).find((m) => m.icon === "salt")!;
    expect(salt.parts).toEqual([expect.objectContaining({ v: 6, dim: true })]);
  });
});
