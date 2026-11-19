import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Radar } from "./Radar";
import { Solid } from "./Solid";

// Bars study §13 (his 20 Nov «qualche poligono o solido tridimensionale»; VIS-52, VIS-70).
const ranges = [
  { from: 0, level: "bad" as const },
  { from: 50, level: "good" as const },
  { from: 150, level: "fair" as const },
];
const axis = (key: string, v: number) => ({
  key,
  name: key,
  v,
  t: 100,
  color: "c",
  ranges,
  label: v + " / 100",
});

describe("shapes: the day as a polygon and as a solid (VIS-52, VIS-70)", () => {
  it("a polygon: the target ring, the green band, a dot per axis, no words but its label", () => {
    const h = renderToStaticMarkup(
      <Radar
        axes={[axis("kcal", 120), axis("protein", 80), axis("fat", 40)]}
        label="Il giorno"
      />,
    );
    expect(h).toContain('class="target"');
    expect(h).toContain('class="good"');
    expect(h.match(/class="dot"/g)).toHaveLength(3);
    expect(h).toContain("protein 80 / 100");
    expect(h).not.toMatch(/>(ok|ottimo|pessimo)</);
  });
  it("a solid: one column per row × col, five faces each, a dot per view", () => {
    const h = renderToStaticMarkup(
      <Solid
        data={{
          label: "giorno",
          cols: [
            { name: "a", icon: { fam: "food", sub: "lunch" } },
            { name: "b", icon: {} },
          ],
          rows: [
            { name: "P", key: "p", color: "x" },
            { name: "C", key: "c", color: "y" },
          ],
          v: [
            [10, 20],
            [30, 40],
          ],
        }}
        viewLabels={["1", "2", "3", "4"]}
      />,
    );
    expect(h.match(/class="col"/g)).toHaveLength(4);
    expect(h.match(/class="f /g)).toHaveLength(20);
    expect(h.match(/class="dot/g)).toHaveLength(4);
    expect(h).toContain("--s:100%");
  });
});
