/** Tests for core/nutrition/display.ts — the shared display values. */
import { describe, expect, it } from "vitest";
import { detailLines, macroBars, stripValues } from "./display";
import type { TotalsLine } from "./totals";

const zero = { sugars: "0", saturatedFat: "0", salt: "0" };

describe("stripValues", () => {
  it("formats kcal with its unit and grams without, in the user's locale", () => {
    const v = stripValues(
      { kcal: "422.2", protein: "15.8", carbs: "46", fat: "15.7", fiber: "14.3" },
      "it",
    );
    expect(v.energy).toBe("422 kcal");
    expect([v.protein, v.carbs, v.fat, v.fiber]).toEqual(["16", "46", "16", "14"]);
    expect(v.split).not.toBeNull();
  });

  it("keeps decimals when asked (per-100 lists)", () => {
    expect(
      stripValues(
        { kcal: "42", protein: "0.5", carbs: "10.5", fat: "0.1", fiber: "1.4" },
        "it",
        1,
      ).carbs,
    ).toBe("10,5");
  });
});

describe("detailLines", () => {
  const line: TotalsLine & { name: string; unit: string } = {
    name: "Prugne",
    unit: "g",
    quantity: "50",
    per100: {
      kcal: "42",
      protein: "0.5",
      carbs: "10.5",
      fat: "0.1",
      fiber: "1.4",
      ...zero,
    },
    packagePriceCents: null,
    packageSize: null,
  };

  it("shows the quantity actually eaten and its kcal, servings applied", () => {
    const [d] = detailLines([line], "2", "it");
    expect(d?.amount).toBe("100 g");
    expect(d?.values.energy).toBe("42 kcal");
  });
});

describe("macroBars", () => {
  const peanut = {
    protein: "25.8",
    carbs: "14",
    sugars: "6",
    fat: "49",
    saturatedFat: "10",
    fiber: "8.2",
  };

  it("scales per 100 g, with sugars and saturated fat as parts", () => {
    const rows = macroBars(peanut, "it");
    // Bar lengths are floats (drawing only): compare to 3 decimals.
    const round = (x: number) => Math.round(x * 1000) / 1000;
    expect(rows.map((r) => [r.key, r.grams, round(r.share)])).toEqual([
      ["protein", "25,8", 0.258],
      ["carbs", "14,0", 0.14],
      ["fat", "49,0", 0.49],
      ["fiber", "8,2", 0.082],
    ]);
    expect(rows[1]!.part).toEqual({ key: "sugars", grams: "6,0", share: 0.06 });
    expect(rows[2]!.part?.share).toBe(0.1);
  });

  it("scales to the largest macro when a serving has more than 100 g", () => {
    const rows = macroBars({ ...peanut, carbs: "150", sugars: "200" }, "it");
    expect(rows[1]!.share).toBe(1);
    expect(rows[1]!.part?.share).toBe(1); // a part never exceeds its macro
    expect(rows[0]!.share).toBeCloseTo(25.8 / 150);
  });
});
