import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Radar } from "./Radar";

// Bars study §13 (his 20 Nov «qualche poligono o solido tridimensionale»; VIS-52, VIS-22).
const ranges = [
  { from: 0, level: "bad" as const },
  { from: 50, level: "good" as const },
  { from: 150, level: "fair" as const },
];
const axis = (key: string, v: number) => ({
  icon: key,
  n: String(v),
  name: key,
  v,
  t: 100,
  ranges,
  label: v + " / 100",
});

describe("the day as a polygon (VIS-52, VIS-22)", () => {
  it("the target ring, the blended ranges per axis, a dot per axis, the scale once, no range words", () => {
    const h = renderToStaticMarkup(
      <Radar
        axes={[axis("kcal", 120), axis("protein", 80), axis("fat", 40)]}
        label="Il giorno"
      />,
    );
    expect(h).toContain('class="target"');
    expect(h.match(/<radialGradient/g)).toHaveLength(3);
    expect(h.match(/class="tick"/g)).toHaveLength(4);
    expect(h.match(/class="dot"/g)).toHaveLength(3);
    expect(h).toContain("protein 80 / 100");
    expect(h).not.toMatch(/>(ok|ottimo|pessimo)</);
  });
});
