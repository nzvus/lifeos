import { describe, expect, it } from "vitest";
import { bandScore, checkModel, editWeights, score } from "./model";
import { FOOD, REGISTRY, SLEEP } from "./registry";

describe("the registry", () => {
  it("every model is well declared: defaults within ranges, locked limits above zero, no shared pattern", () => {
    for (const m of REGISTRY) expect(checkModel(m)).toEqual([]);
    const patterns = REGISTRY.map((m) => m.parts.map((p) => p.weight.default).join("/"));
    expect(new Set(patterns).size).toBe(patterns.length);
    for (const m of REGISTRY)
      expect(m.parts.reduce((a, p) => a + p.weight.default, 0)).toBe(100);
  });
  it("one domain per model", () => {
    expect(new Set(REGISTRY.map((m) => m.domain)).size).toBe(REGISTRY.length);
  });
});

describe("score", () => {
  it("weighs the parts, 0–100, and says which version made it", () => {
    const s = score(SLEEP, { duration: 0.75, regularity: 0.5, feel: 1 });
    expect(s.value).toBe(70); // 0.4 × 75 + 0.4 × 50 + 0.2 × 100
    expect([s.version, s.weightsSince]).toEqual([1, "2026-10-17"]);
    expect(s.missing).toEqual([]);
  });
  it("a part that cannot be computed is left out and named; the rest are weighed among themselves", () => {
    const s = score(SLEEP, { duration: 0.75, regularity: 0.5, feel: null });
    expect(s.missing).toEqual(["feel"]);
    expect(s.value).toBe(63); // (40 × 75 + 40 × 50) ÷ 80 = 62.5
    expect(score(SLEEP, {}).value).toBeNull();
  });
  it("a scorer out of 0–1 is an error", () => {
    expect(() => score(SLEEP, { duration: 1.2 })).toThrow(RangeError);
  });
});

describe("weights", () => {
  it("move within their range; a health limit cannot go under its minimum", () => {
    const e = editWeights(FOOD, { density: 70, limits: 0, value: 10 }, "2026-10-20");
    expect(e.weights.values).toEqual({ density: 60, limits: 20, value: 10 });
    expect(e.rejected).toEqual([
      { key: "density", asked: 70, kept: 60 },
      { key: "limits", asked: 0, kept: 20 },
    ]);
  });
  it("a dated edit makes the score, and the score says so", () => {
    const { weights } = editWeights(SLEEP, { duration: 50, feel: 0 }, "2026-10-20");
    const s = score(SLEEP, { duration: 1, regularity: 0, feel: 1 }, weights);
    expect(s.value).toBe(56); // 50 ÷ 90
    expect(s.weightsSince).toBe("2026-10-20");
  });
  it("an edit for another version or model is not used", () => {
    const { weights } = editWeights(SLEEP, { duration: 50 }, "2026-10-20");
    expect(
      score(SLEEP, { duration: 1, regularity: 0, feel: 0 }, { ...weights, version: 0 })
        .value,
    ).toBe(40);
    expect(editWeights(SLEEP, { nope: 5 }, "2026-10-20").rejected).toEqual([
      { key: "nope", asked: 5, kept: 0 },
    ]);
  });
});

describe("bandScore", () => {
  it("1 inside the band, falling linearly to 0 at the tolerance beyond its edge", () => {
    expect(bandScore(8, { low: 7, high: 9 }, 2)).toBe(1);
    expect(bandScore(6, { low: 7, high: 9 }, 2)).toBe(0.5);
    expect(bandScore(4, { low: 7, high: 9 }, 2)).toBe(0);
    expect(bandScore(12, { low: 7 }, 2)).toBe(1); // at least
    expect(bandScore(6, { high: 5 }, 4)).toBe(0.75); // at most
  });
});
