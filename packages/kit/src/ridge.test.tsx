import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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
