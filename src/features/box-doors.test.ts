// PAT-30, VIS-40 (Deliver ③): a thing's doors are its plan's level-1 slots, in order.
import { describe, expect, it } from "vitest";
import { missingDoors, planDoors } from "./box-doors";

describe("planDoors (PAT-30)", () => {
  it("keeps the plan's order, not the place's", () => {
    const d = planDoors("food", {
      nova: { label: "NOVA" },
      nutrients: { label: "Nutrienti" },
    });
    expect(d.map((x) => x.key)).toEqual(["nutrients", "nova"]);
  });

  it("leaves out what the place has no data for (PRD-22) and names it", () => {
    expect(planDoors("food", { nutrients: { label: "N" } }).map((x) => x.key)).toEqual([
      "nutrients",
    ]);
    expect(missingDoors("food", { nutrients: { label: "N" } })).toEqual(["nova"]);
  });

  it("ignores a key that is not in the open level", () => {
    expect(planDoors("food", { usedIn: { label: "Usato in" } })).toEqual([]);
  });
});
