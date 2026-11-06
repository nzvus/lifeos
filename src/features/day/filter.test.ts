import { describe, expect, it } from "vitest";
import { NONE, facets, matches, restore, toggle, type Facetted } from "./filter";

const rows: Facetted[] = [
  { fam: "food", status: "done" },
  { fam: "food", status: "planned" },
  { fam: "train", status: "done" },
  { fam: "body", status: "skipped" },
];

describe("Oggi's filters", () => {
  it("offers each facet's values with counts, the states in a fixed order", () => {
    expect(facets(rows)).toEqual({
      fam: [
        { value: "food", count: 2 },
        { value: "train", count: 1 },
        { value: "body", count: 1 },
      ],
      status: [
        { value: "done", count: 2 },
        { value: "planned", count: 1 },
        { value: "skipped", count: 1 },
      ],
    });
  });

  it("keeps the domains in the registry's order, unknown ones last", () => {
    const order = ["body", "food", "train"];
    expect(
      facets([...rows, { fam: "x", status: "done" }], order).fam.map((f) => f.value),
    ).toEqual(["body", "food", "train", "x"]);
  });

  it("does not offer a facet with one value", () => {
    expect(facets(rows.slice(0, 1))).toEqual({ fam: [], status: [] });
  });

  it("widens within a facet and narrows across facets", () => {
    const pick = (s = NONE) => rows.filter((r) => matches(r, s));
    expect(pick()).toHaveLength(4);
    const foodOrTrain = toggle(toggle(NONE, "fam", "food"), "fam", "train");
    expect(pick(foodOrTrain)).toHaveLength(3);
    expect(pick(toggle(foodOrTrain, "status", "done"))).toEqual([
      { fam: "food", status: "done" },
      { fam: "train", status: "done" },
    ]);
    expect(toggle(foodOrTrain, "fam", "food")).toEqual({ fam: ["train"], status: [] });
  });

  it("restores a remembered choice only where the day offers it", () => {
    const offered = facets(rows);
    expect(restore({ fam: ["food", "money", 3], status: "done" }, offered)).toEqual({
      fam: ["food"],
      status: [],
    });
    expect(restore(null, offered)).toEqual(NONE);
  });
});
