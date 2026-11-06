import { describe, expect, it } from "vitest";
import { feetLabel, hoursOnFeetOn, type FeetDay } from "./feet";

// His steps entries, 21–28 Oct (export of 29 Oct): the level he picked each day.
const OCT: FeetDay[] = [
  { day: "2026-10-21", level: "sitting" },
  { day: "2026-10-22", level: "mixed" },
  { day: "2026-10-23", level: "sitting" },
  { day: "2026-10-24", level: "mixed" },
  { day: "2026-10-25", level: "mixed" },
  { day: "2026-10-26", level: "mixed" },
  { day: "2026-10-27", level: "sitting" },
  { day: "2026-10-28", level: "sitting" },
];

describe("hoursOnFeetOn (energy-day.md §8)", () => {
  it("reads an old level as hours", () => {
    expect(hoursOnFeetOn("2026-10-27", OCT)).toEqual({ hours: 2, source: "level" });
  });

  it("a day with no level takes the median of the 14 days before, not «seduto»", () => {
    const days = [...OCT, { day: "2026-10-29" as const }];
    expect(hoursOnFeetOn("2026-10-29", days)).toEqual({ hours: 3.5, source: "median" });
  });

  it("the day's own hours win, clamped to 0–16", () => {
    const days = [...OCT, { day: "2026-10-29" as const, onFeetH: 6.5, level: "sitting" }];
    expect(hoursOnFeetOn("2026-10-29", days)).toEqual({ hours: 6.5, source: "said" });
    expect(hoursOnFeetOn("2026-10-30", [{ day: "2026-10-30", onFeetH: 30 }]).hours).toBe(
      16,
    );
  });

  it("days older than 14 do not count; nothing known gives 3 h", () => {
    expect(hoursOnFeetOn("2026-11-20", OCT)).toEqual({ hours: 3, source: "default" });
  });
});

describe("feetLabel", () => {
  it("reads the number in six bands", () => {
    expect([1, 3.5, 5, 7, 9, 12].map(feetLabel)).toEqual([
      "quasi sempre seduto",
      "per lo più seduto",
      "metà e metà",
      "molto in piedi",
      "in piedi quasi tutto il giorno",
      "lavoro fisico",
    ]);
  });
});
