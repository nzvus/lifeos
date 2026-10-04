/** Compound levels (ADR-0039): caffeine's curve, creatine's stores. */
import { describe, expect, it } from "vitest";
import { addDays } from "../shared/dates";
import { caffeineAt, creatineSaturation } from "./levels";

const H = 3_600_000;

describe("caffeineAt", () => {
  it("peaks within the hour and halves about every 5 hours after", () => {
    const doses = [{ at: 0, amount: 100 }];
    expect(caffeineAt(doses, -H)).toBe(0);
    const peak = Math.max(...[0.5, 0.75, 1, 1.25].map((h) => caffeineAt(doses, h * H)));
    expect(peak).toBeGreaterThan(85);
    expect(peak).toBeLessThan(100);
    const at6 = caffeineAt(doses, 6 * H);
    const at11 = caffeineAt(doses, 11 * H);
    expect(at11 / at6).toBeCloseTo(0.5, 2);
  });

  it("adds doses up", () => {
    const one = caffeineAt([{ at: 0, amount: 80 }], 3 * H);
    expect(
      caffeineAt(
        [
          { at: 0, amount: 80 },
          { at: 0, amount: 80 },
        ],
        3 * H,
      ),
    ).toBeCloseTo(2 * one);
  });
});

describe("creatineSaturation", () => {
  const days = Array.from({ length: 70 }, (_, i) => addDays("2026-08-01", i));
  it("fills in 28 days of 3–5 g and empties in 35 without", () => {
    const grams = new Map(days.slice(0, 28).map((d) => [d, 5]));
    const s = creatineSaturation(grams, days);
    expect(s[13]).toBeCloseTo(0.5, 1);
    expect(s[27]).toBeCloseTo(1, 5);
    expect(s[27 + 35]).toBeCloseTo(0, 5);
  });

  it("counts a small dose in proportion", () => {
    const grams = new Map([[days[0]!, 1.5]]);
    expect(creatineSaturation(grams, days.slice(0, 1))[0]).toBeCloseTo(0.5 / 28);
  });
});
