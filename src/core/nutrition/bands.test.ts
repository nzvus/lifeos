/** Tests for core/nutrition/bands.ts (ADR-0023). */
import { describe, expect, it } from "vitest";
import { macroBands, trainingLoad, zoneOf, zoneScore } from "./bands";

describe("macroBands", () => {
  it("per kg, by training load and goal", () => {
    const rest = macroBands({ kg: 80, kcal: 2500, load: "rest", cutting: false });
    expect(rest.protein).toEqual({ floor: 96, low: 128, high: 176, ceiling: 208 });
    expect(rest.carbs).toEqual({ floor: 120, low: 160, high: 240, ceiling: 640 });
    // Fat: 0.8–1.0 g/kg; the ceiling is the larger of 1 g/kg and 35 % of kcal (97 g).
    expect(rest.fat).toEqual({ floor: 48, low: 64, high: 80, ceiling: 97 });
    expect(rest.fiber).toEqual({ floor: 25, low: 35, high: 50, ceiling: 70 });
    expect(rest.kcal).toEqual({ floor: 2125, low: 2375, high: 2625, ceiling: 2750 });

    const gym = macroBands({ kg: 80, kcal: 2500, load: "training", cutting: true });
    expect(gym.carbs).toMatchObject({ floor: 200, low: 240, high: 400 });
    expect(gym.protein).toMatchObject({ low: 144, high: 192, ceiling: 224 });
    expect(
      macroBands({ kg: 80, kcal: null, load: "long", cutting: false }).kcal,
    ).toBeUndefined();
  });

  it("training load from the day's minutes", () => {
    expect(trainingLoad(0, 0)).toBe("rest");
    expect(trainingLoad(60, 0)).toBe("training");
    expect(trainingLoad(95, 0)).toBe("long");
    expect(trainingLoad(70, 60)).toBe("long");
  });
});

describe("zones", () => {
  const b = { floor: 100, low: 120, high: 160, ceiling: 200 };
  it("names the zone", () => {
    expect([90, 110, 140, 180, 210].map((v) => zoneOf(v, b))).toEqual([
      "below_floor",
      "low",
      "good",
      "high",
      "above_ceiling",
    ]);
  });
  it("scores 100 in the good zone, 50 at floor and ceiling, 0 beyond", () => {
    expect(zoneScore(140, b)).toBe(100);
    expect(zoneScore(100, b)).toBe(50);
    expect(zoneScore(110, b)).toBe(75);
    expect(zoneScore(200, b)).toBe(50);
    expect(zoneScore(80, b)).toBe(0);
    expect(zoneScore(240, b)).toBe(0);
  });
});
