/** Tests for core/nutrition/quality-summary.ts (ADR-0012). */
import { describe, expect, it } from "vitest";
import { NUTRIENT_KEYS, type NutrientValues } from "./nutrients";
import { NO_QUALITY } from "./quality";
import { eatenQuality, mealTags, qualitySummary } from "./quality-summary";

const per100 = (v: Partial<NutrientValues>): NutrientValues =>
  ({ ...Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, "0"])), ...v }) as NutrientValues;

const oats = {
  quantity: "50",
  per100: per100({ kcal: "370", protein: "13", fiber: "10" }),
  quality: {
    nova: 1 as const,
    origin: "plant" as const,
    fiberTypes: ["beta_glucan" as const, "insoluble" as const],
  },
};
const skyr = {
  quantity: "200",
  per100: per100({ kcal: "62", protein: "11" }),
  quality: { nova: 1 as const, origin: "animal" as const, fiberTypes: [] },
};
const biscuits = {
  quantity: "30",
  per100: per100({ kcal: "480", protein: "6", fiber: "3" }),
  quality: NO_QUALITY,
};

describe("qualitySummary", () => {
  it("shares energy by NOVA, protein by origin, splits fibre by type; unclassified = unknown", () => {
    // kcal: oats 185, skyr 124, biscuits 144 = 453. protein: 6.5, 22, 1.8 = 30.3.
    const s = qualitySummary([oats, skyr, biscuits]);
    expect(s.nova).toEqual({ 1: 68, 2: 0, 3: 0, 4: 0, unknown: 32 });
    expect(s.origin).toEqual({ plant: 21, animal: 73, mixed: 0, unknown: 6 });
    expect(s.fiber.beta_glucan).toBe("2.5");
    expect(s.fiber.insoluble).toBe("2.5");
    expect(s.fiber.unknown).toBe("0.9");
    expect(s.fiber.pectin).toBe("0");
  });

  it("scales by servings without changing the shares", () => {
    const one = qualitySummary([oats, skyr]);
    const two = qualitySummary([oats, skyr], "2");
    expect(two.nova).toEqual(one.nova);
    expect(two.fiber.beta_glucan).toBe("5");
  });

  it("gives zero shares for nothing", () => {
    expect(qualitySummary([]).nova).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, unknown: 0 });
  });
});

describe("mealTags", () => {
  it("is the union of the ingredients' tags, by name, alphabetical", () => {
    const map = new Map([
      [
        "a",
        [
          { name: "Lidl", icon: "store" },
          { name: "Bio", icon: "leaf" },
        ],
      ],
      ["b", [{ name: "Lidl", icon: "store" }]],
    ]);
    expect(mealTags(["a", "b", "c"], map).map((t) => t.name)).toEqual(["Bio", "Lidl"]);
  });
});

describe("eatenQuality", () => {
  it("counts eaten entries only, servings applied", () => {
    const s = eatenQuality([
      { status: "eaten", servings: "2", lines: [oats] },
      { status: "planned", servings: "1", lines: [biscuits] },
    ]);
    expect(s.nova.unknown).toBe(0);
    expect(s.fiber.beta_glucan).toBe("5"); // 50 g × 2 servings × 10 % / 2 types
  });
});
