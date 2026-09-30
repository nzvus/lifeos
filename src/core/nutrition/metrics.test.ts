/** Tests for core/nutrition/metrics.ts — sorting values and ratios. */
import { describe, expect, it } from "vitest";
import {
  browseFoods,
  metricText,
  metricValue,
  naturalDirection,
  type MetricRow,
} from "./metrics";

const whey: MetricRow = {
  nutrients: {
    kcal: "378",
    protein: "71",
    carbs: "15",
    sugars: "5",
    fat: "3.5",
    saturatedFat: "2",
    fiber: "1.4",
    salt: "0.5",
  },
  costCents: 382, // per 100 g
};

describe("metricValue", () => {
  it("is the value itself without a divisor", () => {
    expect(metricValue(whey, "protein", "none")).toBe(71);
    expect(metricValue(whey, "cost", "none")).toBe(382);
  });

  it("divides and scales: per 100 kcal, per €, per 100 g of a nutrient", () => {
    expect(metricValue(whey, "protein", "kcal")).toBeCloseTo(18.78, 2); // g per 100 kcal
    expect(metricValue(whey, "protein", "cost")).toBeCloseTo(18.59, 2); // g per €
    expect(metricValue(whey, "sugars", "carbs")).toBeCloseTo(33.33, 2); // % of carbs
    expect(metricValue(whey, "cost", "protein")).toBeCloseTo(538.03, 2); // cents per 100 g protein
  });

  it("is null when a side is missing or the divisor is zero", () => {
    expect(metricValue({ ...whey, costCents: null }, "protein", "cost")).toBeNull();
    expect(metricValue({ ...whey, costCents: null }, "cost", "none")).toBeNull();
    expect(
      metricValue(
        { ...whey, nutrients: { ...whey.nutrients, fiber: "0" } },
        "kcal",
        "fiber",
      ),
    ).toBeNull();
  });
});

describe("naturalDirection", () => {
  it("puts the usual answer first", () => {
    expect(naturalDirection("protein")).toBe("desc");
    expect(naturalDirection("fiber")).toBe("desc");
    expect(naturalDirection("sugars")).toBe("asc");
    expect(naturalDirection("cost")).toBe("asc");
  });
});

describe("browseFoods", () => {
  const rows = [
    { name: "Whey", uses: 1, row: whey },
    {
      name: "Mandorle",
      uses: 5,
      row: {
        nutrients: { ...whey.nutrients, kcal: "600", protein: "21" },
        costCents: 150,
      },
    },
    {
      name: "Sale",
      uses: 0,
      row: { nutrients: { ...whey.nutrients, kcal: "0", protein: "0" }, costCents: null },
    },
  ];
  const base = {
    query: "",
    describe: (r: (typeof rows)[number]) => ({
      text: r.name,
      name: r.name,
      uses: r.uses,
      lastUsed: null,
    }),
    metricRow: (r: (typeof rows)[number]) => r.row,
    locale: "it",
  };
  const names = (xs: typeof rows) => xs.map((r) => r.name);

  it("sorts by a ratio, divisions by zero last", () => {
    expect(
      names(
        browseFoods(rows, { ...base, sort: "protein", per: "kcal", direction: "desc" }),
      ),
    ).toEqual(["Whey", "Mandorle", "Sale"]);
  });

  it("still sorts by usage and name", () => {
    expect(
      names(browseFoods(rows, { ...base, sort: "used", per: "none", direction: "desc" })),
    ).toEqual(["Mandorle", "Whey", "Sale"]);
    expect(
      names(browseFoods(rows, { ...base, sort: "name", per: "kcal", direction: "asc" })),
    ).toEqual(["Mandorle", "Sale", "Whey"]);
  });
});

describe("metricText", () => {
  it("formats cost in euro, shares in %, the rest with the nutrient's unit", () => {
    expect(metricText(538.03, "cost", "protein", "it")).toMatch(/5,38/);
    expect(metricText(33.333, "sugars", "carbs", "it")).toBe("33,3 %");
    expect(metricText(18.78, "protein", "kcal", "it")).toBe("18,8 g");
  });
});
