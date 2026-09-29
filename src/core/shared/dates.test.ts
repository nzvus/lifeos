/** Tests for core/shared/dates.ts — calendar days and "today" per time zone. */
import { describe, expect, it } from "vitest";
import { addDays, isValidDay, isValidTimeZone, todayIn } from "./dates";

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
});
