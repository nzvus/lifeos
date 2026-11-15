import { describe, expect, it } from "vitest";
import { mealDoors } from "./meal-doors";

const l0 = { macros: [{ key: "protein" as const, v: 30 }] };
const d = {
  stats: [{ label: "Costo", value: "≈ 1,40 €" }],
  lines: [{ label: "Fiocchi d'avena", value: "60 g" }],
  foot: "",
};

describe("mealDoors (PAT-30: one box for a meal on the day and a saved pasto)", () => {
  it("gives the same doors wherever the meal is met: nutrients, foods, cost", () => {
    const doors = mealDoors(l0, d);
    expect(doors.map((x) => x.key)).toEqual(["nutrients", "foods", "more"]);
    expect(doors[1]!.value).toBe("1");
    expect(doors[2]).toMatchObject({ label: "Costo", value: "≈ 1,40 €" });
  });

  it("lets a place put its own rows behind «Cibi» (a pasto: each opens its cibo)", () => {
    expect(mealDoors(l0, d, "rows")[1]!.panel).toBe("rows");
  });

  it("has no doors without nutrients", () => {
    expect(mealDoors(null, d)).toEqual([]);
  });
});
