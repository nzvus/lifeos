/** Tests for core/nutrition/trends.ts (grouped bars on one scale). */
import { describe, expect, it } from "vitest";
import { groupedBars } from "./trends";

describe("groupedBars", () => {
  it("scales each nutrient to its target, or to its own max when there is none", () => {
    const r = groupedBars(
      [
        {
          logged: true,
          values: { protein: "120", fiber: "20" },
          targets: { protein: "150", fiber: null },
        },
        {
          logged: true,
          values: { protein: "150", fiber: "40" },
          targets: { protein: "150", fiber: null },
        },
        { logged: false, values: {}, targets: { protein: "150" } },
      ],
      ["protein", "fiber"],
    );
    expect(r.map((d) => d.map((b) => [b.share, b.relative]))).toEqual([
      [
        [0.8, false],
        [0.5, true],
      ],
      [
        [1, false],
        [1, true],
      ],
      [
        [null, false],
        [null, true],
      ],
    ]);
  });
});
