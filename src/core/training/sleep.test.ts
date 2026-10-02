/** Tests for core/training/sleep.ts (ADR-0031). */
import { describe, expect, it } from "vitest";
import { nightInstants, sleepHours, sleepScore } from "./sleep";

describe("sleep", () => {
  it("a night across midnight is one night ending on the given day", () => {
    const n = nightInstants("2026-10-02", "23:40", "07:00", "Europe/Rome");
    expect(n.bedAt.toISOString()).toBe("2026-10-01T21:40:00.000Z");
    expect(n.wakeAt.toISOString()).toBe("2026-10-02T05:00:00.000Z");
    expect(sleepHours(n.bedAt, n.wakeAt)).toBe(7.3);
    // Bed after midnight: the same day.
    const late = nightInstants("2026-10-02", "01:30", "08:00", "Europe/Rome");
    expect(sleepHours(late.bedAt, late.wakeAt)).toBe(6.5);
  });

  it("scores 100 for 7–9 h, 50 at 6 or 10, 0 at 4 or 12", () => {
    expect([7, 8, 9].map(sleepScore)).toEqual([100, 100, 100]);
    expect(sleepScore(6)).toBe(50);
    expect(sleepScore(6.5)).toBe(75);
    expect(sleepScore(10)).toBe(50);
    expect(sleepScore(4)).toBe(0);
    expect(sleepScore(3)).toBe(0);
    expect(sleepScore(12)).toBe(0);
  });
});
