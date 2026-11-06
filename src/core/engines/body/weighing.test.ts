import { describe, expect, it } from "vitest";
import { paceBand, weighingParts } from "./weighing";

// The developer's weigh-ins, 14–23 October; goal 72.3 kg by 20 December.
const series = [
  { day: "2026-10-14", kg: 75.5 },
  { day: "2026-10-15", kg: 75.6 },
  { day: "2026-10-16", kg: 75.3 },
  { day: "2026-10-18", kg: 76 },
  { day: "2026-10-19", kg: 77 },
  { day: "2026-10-20", kg: 76 },
  { day: "2026-10-21", kg: 75.4 },
  { day: "2026-10-22", kg: 77.3 },
  { day: "2026-10-23", kg: 76.2 },
];

describe("weighing score parts", () => {
  it("asks the goal's pace, never faster than 1 % a week", () => {
    // Needed −0.49 kg a week: on the way from 0.39 down to the 0.76 cap.
    const b = paceBand({ nowKg: 76.2, needed: -0.49, target: 72.3 })!;
    expect(b.low).toBeCloseTo(-0.762);
    expect(b.high).toBeCloseTo(-0.392);
    // A goal faster than the cap asks the cap.
    expect(paceBand({ nowKg: 80, needed: -1.5, target: 70 })).toEqual({
      low: -0.8,
      high: -0.8,
    });
    // Within 0.3 kg: keep it, ±0.25 % a week.
    expect(paceBand({ nowKg: 80, needed: -0.05, target: 79.8 })).toEqual({
      low: -0.2,
      high: 0.2,
    });
    expect(paceBand({ nowKg: 80, needed: null, target: 75 })).toBeNull();
  });

  it("scores the pace inside the band, falling to 0 at 0.5 % a week outside", () => {
    const at = (actual: number) =>
      weighingParts({
        reliability: 1,
        pace: { nowKg: 76.2, actual, needed: -0.49, target: 72.3 },
        series,
        today: "2026-10-23",
      }).pace;
    expect(at(-0.5)).toBe(1);
    expect(at(-0.2)).toBeCloseTo(1 - 0.192 / 0.381, 2);
    // Gaining while the goal is to lose: 0.
    expect(at(0.3)).toBe(0);
    expect(
      weighingParts({ reliability: 1, pace: null, series, today: "2026-10-23" }).pace,
    ).toBeNull();
  });

  it("counts the days weighed in the last 7, implausible ones left out, 5 as full", () => {
    const p = weighingParts({
      reliability: 0.75,
      pace: null,
      series,
      today: "2026-10-23",
    });
    expect(p).toMatchObject({ reliable: 0.75, days: 6, consistency: 1 });
    const typo = [...series.slice(0, -1), { day: "2026-10-23", kg: 67.2 }];
    expect(
      weighingParts({ reliability: 1, pace: null, series: typo, today: "2026-10-23" })
        .days,
    ).toBe(5);
    const few = series.filter((w) => w.day <= "2026-10-19");
    expect(
      weighingParts({ reliability: 1, pace: null, series: few, today: "2026-10-23" }),
    ).toMatchObject({ days: 2, consistency: 0.4 });
  });
});
