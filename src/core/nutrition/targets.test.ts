/** Tests for core/nutrition/targets.ts: kinds, tolerance, auto targets. */
import { describe, expect, it } from "vitest";
import { assessTarget, withAutoTargets, type Targets } from "./targets";

describe("assessTarget", () => {
  it("min: under until reached, then on (above is fine)", () => {
    expect(assessTarget("100", "150", "min")).toMatchObject({
      status: "under",
      delta: "50.0",
    });
    expect(assessTarget("180", "150", "min")).toMatchObject({ status: "on", ratio: 1.2 });
  });
  it("max: on while under, over when past", () => {
    expect(assessTarget("40", "50", "max").status).toBe("on");
    expect(assessTarget("60", "50", "max")).toMatchObject({
      status: "over",
      delta: "10.0",
    });
  });
  it("target: on within ±5 %, under/over outside", () => {
    expect(assessTarget("1920", "2000", "target").status).toBe("on"); // -4 %
    expect(assessTarget("1800", "2000", "target").status).toBe("under"); // -10 %
    expect(assessTarget("2150", "2000", "target").status).toBe("over"); // +7.5 %
  });
  it("no target, or a zero target, means nothing to assess", () => {
    expect(assessTarget("10", null, "min")).toEqual({ status: "none" });
    expect(assessTarget("10", "0", "max")).toEqual({ status: "none" });
  });
});

describe("withAutoTargets", () => {
  const base: Targets = {
    kcal: "2400",
    protein: "150",
    carbs: null,
    sugars: null,
    fat: null,
    saturatedFat: null,
    fiber: null,
    salt: "4",
  };
  it("fills sugars and saturated fat from energy, salt from WHO, but never overrides", () => {
    const r = withAutoTargets(base);
    expect(r.targets.sugars).toBe("108"); // 90 g × 2400/2000
    expect(r.targets.saturatedFat).toBe("26.7"); // 2400 × 10 % / 9
    expect(r.targets.salt).toBe("4"); // user's own value kept
    expect(r.auto).toEqual(["sugars", "saturatedFat"]);
  });
  it("scales on the 2000 kcal reference without an energy target", () => {
    expect(withAutoTargets({ ...base, kcal: null }).targets.sugars).toBe("90");
  });
});
