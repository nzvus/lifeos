import { describe, expect, it } from "vitest";
import { circularTime, exactSum, regularity, streak } from "./metrics";

describe("exactSum", () => {
  it("adds decimals exactly: totals equal their parts", () => {
    expect(exactSum(["0.1", "0.2"])).toBe("0.3"); // 0.1 + 0.2 in floats is 0.30000000000000004
    expect(exactSum(["18.59", 0.01])).toBe("18.6");
    expect(exactSum([])).toBe("0");
  });
});

describe("streak", () => {
  const o = { excusedKeeps: true, lastIsOpen: false };
  it("counts met windows back from the latest", () => {
    expect(streak(["missed", "met", "met", "met"], o)).toBe(3);
    expect(streak(["met", "missed"], o)).toBe(0);
  });
  it("an excused window keeps the streak only if the habit says so", () => {
    expect(streak(["met", "excused", "met"], o)).toBe(2);
    expect(streak(["met", "excused", "met"], { ...o, excusedKeeps: false })).toBe(1);
  });
  it("no data breaks it", () => {
    expect(streak(["met", "unknown", "met"], o)).toBe(1);
  });
  it("today, still open and not met yet, does not break it", () => {
    expect(streak(["met", "met", "missed"], { ...o, lastIsOpen: true })).toBe(2);
    expect(streak(["met", "met", "met"], { ...o, lastIsOpen: true })).toBe(3);
  });
});

describe("regularity", () => {
  it("is 1 for identical values and lower as they spread", () => {
    expect(regularity([8000, 8000, 8000])).toBe(1);
    expect(regularity([7000, 14000, 16500, 13000])).toBeCloseTo(0.724, 3); // mean 12 625, SD 3 489
  });
  it("needs two values and a non-zero mean", () => {
    expect(regularity([8000])).toBeNull();
    expect(regularity([0, 0])).toBeNull();
  });
});

describe("circularTime", () => {
  it("bed at 23:50 and 00:10 averages to midnight, 10 minutes apart", () => {
    const r = circularTime([23 * 60 + 50, 10]);
    expect(r?.mean).toBe(0);
    expect(r?.sdMin).toBeCloseTo(10, 0);
  });
  it("is null with no times", () => {
    expect(circularTime([])).toBeNull();
  });
});
