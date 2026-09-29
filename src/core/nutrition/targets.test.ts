/** Tests for core/nutrition/targets.ts. */
import { describe, expect, it } from "vitest";
import { compareToTarget } from "./targets";

describe("compareToTarget", () => {
  it("reports what is left under the target", () => {
    expect(compareToTarget("1500.0", "2000")).toEqual({
      status: "under",
      remaining: "500.0",
      percent: 75,
    });
  });
  it("reports the excess over the target, with the bar capped at 100", () => {
    expect(compareToTarget("2500.0", "2000")).toEqual({
      status: "over",
      over: "500.0",
      percent: 100,
    });
  });
  it("handles no target and a zero target", () => {
    expect(compareToTarget("10", null)).toEqual({ status: "none" });
    expect(compareToTarget("10", "0")).toEqual({ status: "none" });
  });
});
