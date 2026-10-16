import { describe, expect, it } from "vitest";
import { plannedOn, progress, WEEKDAYS } from "./recurrence";
import { isoWeek } from "./window";

describe("plannedOn", () => {
  it("weekdays plan Monday to Friday", () => {
    expect(plannedOn(WEEKDAYS, "2026-10-16")).toBe(true); // Friday
    expect(plannedOn(WEEKDAYS, "2026-10-17")).toBe(false); // Saturday
  });

  it("every N days counts from its start, never before it", () => {
    const rule = { type: "everyN", n: 3, start: "2026-10-10" } as const;
    expect(plannedOn(rule, "2026-10-13")).toBe(true);
    expect(plannedOn(rule, "2026-10-14")).toBe(false);
    expect(plannedOn(rule, "2026-10-07")).toBe(false);
    expect(() =>
      plannedOn({ type: "everyN", n: 0, start: "2026-10-10" }, "2026-10-10"),
    ).toThrow(RangeError);
  });

  it("N times a week plans no fixed day", () => {
    expect(plannedOn({ type: "timesPerWeek", n: 3 }, "2026-10-15")).toBe(false);
  });

  it("on dates plans those dates only", () => {
    expect(plannedOn({ type: "onDates", dates: ["2026-12-24"] }, "2026-12-24")).toBe(
      true,
    );
    expect(plannedOn({ type: "onDates", dates: ["2026-12-24"] }, "2026-12-25")).toBe(
      false,
    );
  });
});

describe("progress", () => {
  it("the steps goal: weekdays of the week done, out of the weekdays", () => {
    // the developer's week of 12 Oct: 7.000 on Monday (short), then 14.000, 16.500, 13.000
    const over8000 = new Set(["2026-10-13", "2026-10-14", "2026-10-15"]);
    expect(progress(WEEKDAYS, over8000, isoWeek("2026-10-15"))).toEqual({
      done: 3,
      due: 5,
      met: false,
    });
  });

  it("N times a week counts any day of the ISO week", () => {
    const done = new Set(["2026-10-12", "2026-10-17", "2026-10-18", "2026-10-19"]); // the 19th is next week
    expect(progress({ type: "timesPerWeek", n: 3 }, done, isoWeek("2026-10-15"))).toEqual(
      { done: 3, due: 3, met: true },
    );
  });

  it("N times a week refuses a window that is not an ISO week", () => {
    expect(() =>
      progress({ type: "timesPerWeek", n: 3 }, new Set(), {
        from: "2026-10-13",
        to: "2026-10-19",
      }),
    ).toThrow(RangeError);
  });
});
