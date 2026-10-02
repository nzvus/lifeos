import { describe, expect, it } from "vitest";
import { dayAxis } from "./ChartFrame";

/** `n` days ending on `last`, as YYYY-MM-DD (ui/ cannot import core/). */
const daysEnding = (last: string, n: number) =>
  Array.from({ length: n }, (_, i) =>
    new Date(Date.parse(`${last}T12:00:00Z`) - (n - 1 - i) * 86_400_000)
      .toISOString()
      .slice(0, 10),
  );

describe("dayAxis", () => {
  it("names weekdays when the chart fits", () => {
    const days = daysEnding("2026-10-04", 7);
    expect(days.map(dayAxis(days, "en"))).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
  });

  it("marks every fifth day and the month, but not the 30th next to it", () => {
    const days = daysEnding("2026-10-02", 28);
    const labels = days.map(dayAxis(days, "it")).filter(Boolean);
    expect(labels).toEqual(["5", "10", "15", "20", "25", "ott"]);
  });
});
