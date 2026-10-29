import { describe, expect, it } from "vitest";
import { acsmMet } from "./acsm";

const mid = (r: { low: number; high: number } | null) =>
  r ? (r.low + r.high) / 2 : null;

describe("acsmMet (activity.md §8)", () => {
  it("a 5 km run in 28 min (178,6 m/min) is ≈ 11,2 MET", () => {
    // VO₂ = 3.5 + 0.2 × 178.57 = 39.2 → 11.2 MET
    expect(mid(acsmMet(5000, 28))).toBeCloseTo(11.2, 1);
  });
  it("a walk at 5 km/h (83,3 m/min) is ≈ 3,4 MET; 5 % incline adds ≈ 2,1", () => {
    expect(mid(acsmMet(5000, 60))).toBeCloseTo(3.38, 2);
    expect(mid(acsmMet(5000, 60, 5))).toBeCloseTo(5.52, 2);
  });
  it("±10 %, nothing without distance or time", () => {
    const r = acsmMet(5000, 28)!;
    expect(r.high / r.low).toBeCloseTo(1.1 / 0.9, 6);
    expect(acsmMet(null, 28)).toBeNull();
    expect(acsmMet(5000, 0)).toBeNull();
  });
});
