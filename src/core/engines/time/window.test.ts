import { describe, expect, it } from "vitest";
import {
  contains,
  custom,
  dayWindow,
  daysOf,
  isoWeek,
  month,
  over,
  rolling,
} from "./window";

describe("windows", () => {
  it("an ISO week starts on Monday", () => {
    expect(isoWeek("2026-10-15")).toEqual({ from: "2026-10-12", to: "2026-10-18" }); // a Thursday
    expect(isoWeek("2026-10-18")).toEqual({ from: "2026-10-12", to: "2026-10-18" }); // Sunday is its last day
    expect(isoWeek("2026-12-31")).toEqual({ from: "2026-12-28", to: "2027-01-03" }); // across the year
  });

  it("a month knows its length, leap years included", () => {
    expect(month("2026-10-15")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(month("2028-02-10")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(month("2026-02-10").to).toBe("2026-02-28");
  });

  it("a rolling window ends on its day and counts it", () => {
    expect(rolling(7, "2026-10-15")).toEqual({ from: "2026-10-09", to: "2026-10-15" });
    expect(daysOf(rolling(7, "2026-10-15"))).toHaveLength(7);
    expect(() => rolling(0, "2026-10-15")).toThrow(RangeError);
  });

  it("a custom range must not run backwards; a day is its own window", () => {
    expect(() => custom("2026-10-15", "2026-10-14")).toThrow(RangeError);
    expect(dayWindow("2026-10-15")).toEqual({ from: "2026-10-15", to: "2026-10-15" });
    expect(() => dayWindow("2026-02-30")).toThrow(RangeError);
  });

  it("contains compares logical days", () => {
    expect(contains(isoWeek("2026-10-15"), "2026-10-12")).toBe(true);
    expect(contains(isoWeek("2026-10-15"), "2026-10-19")).toBe(false);
  });
});

describe("over: an unlogged day is not zero", () => {
  const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);

  it("is unknown when no day of the window has a value", () => {
    expect(over(rolling(7, "2026-10-15"), new Map(), sum)).toEqual({ known: false });
  });

  it("folds only the days that have a value, and says how many", () => {
    const kcal = new Map([
      ["2026-10-13", 2100],
      ["2026-10-15", 2300],
    ]);
    expect(over(isoWeek("2026-10-15"), kcal, (v) => sum(v) / v.length)).toEqual({
      known: true,
      value: 2200,
      days: 2,
      of: 7,
    });
  });

  it("a day with a real zero is known", () => {
    expect(over(dayWindow("2026-10-15"), new Map([["2026-10-15", 0]]), sum)).toEqual({
      known: true,
      value: 0,
      days: 1,
      of: 1,
    });
  });
});
