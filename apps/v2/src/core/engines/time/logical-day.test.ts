import { describe, expect, it } from "vitest";
import { localParts, logicalDay } from "./logical-day";

const rome = { timeZone: "Europe/Rome", boundaryMin: 4 * 60 };

describe("logicalDay", () => {
  it("is the local date in the person's zone, not UTC's", () => {
    // 23:30 UTC on 15 Oct is 01:30 on 16 Oct in Rome (UTC+2)
    expect(
      logicalDay(new Date("2026-10-15T23:30:00Z"), {
        timeZone: "Europe/Rome",
        boundaryMin: 0,
      }),
    ).toBe("2026-10-16");
  });

  it("puts the hours before the boundary in the day before", () => {
    expect(logicalDay(new Date("2026-10-15T23:30:00Z"), rome)).toBe("2026-10-15"); // 01:30 local
    expect(logicalDay(new Date("2026-10-16T02:00:00Z"), rome)).toBe("2026-10-16"); // 04:00 local: the new day
  });

  it("holds on the night the clocks go back (25 Oct 2026, 03:00 → 02:00 in Rome)", () => {
    // 01:30 UTC is 02:30 local after the change (UTC+1): before the 04:00 boundary
    expect(logicalDay(new Date("2026-10-25T01:30:00Z"), rome)).toBe("2026-10-24");
    // 03:00 UTC is 04:00 local (UTC+1): the 25th starts
    expect(logicalDay(new Date("2026-10-25T03:00:00Z"), rome)).toBe("2026-10-25");
  });

  it("rejects a boundary outside the day", () => {
    expect(() =>
      logicalDay(new Date(), { timeZone: "Europe/Rome", boundaryMin: 24 * 60 }),
    ).toThrow(RangeError);
  });
});

describe("localParts", () => {
  it("gives the wall-clock minute", () => {
    expect(localParts(new Date("2026-10-15T18:00:00Z"), "Europe/Rome")).toEqual({
      date: "2026-10-15",
      minute: 20 * 60,
    });
  });
});
