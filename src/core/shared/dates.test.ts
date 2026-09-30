/** Tests for core/shared/dates.ts — calendar days and "today" per time zone. */
import { describe, expect, it } from "vitest";
import {
  addDays,
  instantFor,
  isValidDay,
  isValidTime,
  isValidTimeZone,
  timeIn,
  todayIn,
} from "./dates";

describe("dates", () => {
  it("rejects impossible days", () => {
    expect(isValidDay("2026-02-28")).toBe(true);
    expect(isValidDay("2026-02-30")).toBe(false);
    expect(isValidDay("26-2-3")).toBe(false);
  });

  it("computes today in the user's zone, not the server's", () => {
    // 22:30 UTC on 29 Sep is already 00:30 on 30 Sep in Rome (UTC+2 in summer).
    const instant = new Date("2026-09-29T22:30:00Z");
    expect(todayIn("UTC", instant)).toBe("2026-09-29");
    expect(todayIn("Europe/Rome", instant)).toBe("2026-09-30");
  });

  it("moves across month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("validates time zone names", () => {
    expect(isValidTimeZone("Europe/Rome")).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
  });

  it("converts a local wall time to the right instant, across daylight saving", () => {
    // Rome is UTC+2 in summer, UTC+1 in winter.
    expect(instantFor("2026-09-29", "12:30", "Europe/Rome").toISOString()).toBe(
      "2026-09-29T10:30:00.000Z",
    );
    expect(instantFor("2026-12-01", "12:30", "Europe/Rome").toISOString()).toBe(
      "2026-12-01T11:30:00.000Z",
    );
    // The day DST ends (25 Oct 2026): before 03:00 still summer time, after it winter.
    expect(instantFor("2026-10-25", "01:00", "Europe/Rome").toISOString()).toBe(
      "2026-10-24T23:00:00.000Z",
    );
    expect(instantFor("2026-10-25", "12:00", "Europe/Rome").toISOString()).toBe(
      "2026-10-25T11:00:00.000Z",
    );
    expect(timeIn(new Date("2026-09-29T10:30:00Z"), "Europe/Rome")).toBe("12:30");
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
  });
});
