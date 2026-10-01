/** Tests for core/nutrition/day-score.ts. */
import { describe, expect, it } from "vitest";
import { dayScore } from "./day-score";
import { NUTRIENT_KEYS, type NutrientKey } from "./nutrients";
import type { QualitySummary } from "./quality-summary";
import type { Targets } from "./targets";

const totals = {
  ...(Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, "0"])) as Record<
    NutrientKey,
    string
  >),
  kcal: "2000",
  protein: "100",
};
const noTargets = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, null])) as Targets;
const fiber = (g: Partial<QualitySummary["fiber"]>) =>
  ({
    inulin_fos: "0",
    beta_glucan: "0",
    resistant_starch: "0",
    pectin: "0",
    psyllium: "0",
    insoluble: "0",
    gos: "0",
    unknown: "0",
    ...g,
  }) as QualitySummary["fiber"];
const quality = (nova: QualitySummary["nova"], f = fiber({})): QualitySummary => ({
  nova,
  origin: { plant: 0, animal: 0, mixed: 0, unknown: 100 },
  fiber: f,
});

describe("dayScore", () => {
  it("weights the three parts 40/35/25 and explains each", () => {
    const r = dayScore({
      totals,
      targets: { ...noTargets, kcal: "2000", protein: "150" }, // kcal on, protein under
      quality: quality(
        { 1: 60, 2: 0, 3: 20, 4: 20, unknown: 0 },
        fiber({ pectin: "3", beta_glucan: "1.5" }),
      ),
    });
    const parts = Object.fromEntries(r.parts.map((p) => [p.key, [p.value, p.weight]]));
    expect(parts).toEqual({
      targets: [50, 40],
      processing: [70, 35],
      fiberVariety: [70, 25],
    });
    expect(r.score).toBe(62); // (50·40 + 70·35 + 70·25) / 100 = 62
  });

  it("leaves out what can't be computed and re-weights the rest", () => {
    const r = dayScore({
      totals,
      targets: noTargets,
      quality: quality({ 1: 0, 2: 0, 3: 0, 4: 0, unknown: 100 }),
    });
    expect(r.parts.map((p) => [p.key, p.value, p.reason, p.weight])).toEqual([
      ["targets", null, "no_targets", 0],
      ["processing", null, "not_classified", 0],
      ["fiberVariety", 0, null, 100],
    ]);
    expect(r.score).toBe(0);
  });

  it("ignores unclassified energy in the processing part", () => {
    const r = dayScore({
      totals,
      targets: noTargets,
      quality: quality({ 1: 40, 2: 0, 3: 0, 4: 0, unknown: 60 }),
    });
    expect(r.parts.find((p) => p.key === "processing")?.value).toBe(100);
  });

  it("with bands, each macro scores by its zone, not by reaching a number", () => {
    const r = dayScore({
      totals: { ...totals, protein: "110", carbs: "300" },
      targets: { ...noTargets, salt: "5" },
      quality: quality({ 1: 100, 2: 0, 3: 0, 4: 0, unknown: 0 }),
      bands: {
        // protein 110 g: between floor 96 and low 128 → 50 + 14/32 × 50 = 72
        protein: { floor: 96, low: 128, high: 176, ceiling: 208, ceilingKind: "health" },
        // carbs 300 g: in the good zone → 100, though it is not "the" target
        carbs: { floor: 120, low: 240, high: 400, ceiling: 640, ceilingKind: "health" },
      },
    });
    // salt 0 ≤ 5: 100. (72 + 100 + 100) / 3 = 91
    expect(r.parts.find((p) => p.key === "targets")).toMatchObject({
      value: 91,
      detail: { on: 2, of: 3 },
    });
  });
});
