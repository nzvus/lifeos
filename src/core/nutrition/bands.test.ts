/** Tests for core/nutrition/bands.ts (ADR-0023, amended by ADR-0025). */
import { describe, expect, it } from "vitest";
import {
  bandFor,
  bandState,
  macroBands,
  trainingLoad,
  zoneOf,
  zoneScore,
  type Band,
} from "./bands";

describe("macroBands", () => {
  it("health floors, good zones by goal and training, health or useful ceilings", () => {
    const b = macroBands({ kg: 76, kcal: 2500, load: "training", cutting: false });
    // Protein: RDA 0.8 g/kg; good 1.6–2.2; no muscle gained past 2.2.
    expect(b.protein).toEqual({
      floor: 61,
      low: 122,
      high: 167,
      ceiling: 167,
      ceilingKind: "useful",
    });
    // Carbs: RDA 130 g; 3–5 g/kg on a training day; more is only energy.
    expect(b.carbs).toEqual({
      floor: 130,
      low: 228,
      high: 380,
      ceiling: 380,
      ceilingKind: "useful",
    });
    // Fat: 20 % / 25–30 % / 35 % of 2500 kcal.
    expect(b.fat).toEqual({
      floor: 56,
      low: 69,
      high: 83,
      ceiling: 97,
      ceilingKind: "health",
    });
    expect(b.fiber).toEqual({
      floor: 25,
      low: 35,
      high: 50,
      ceiling: 70,
      ceilingKind: "useful",
    });
    expect(b.kcal).toBeUndefined();

    const rest = macroBands({ kg: 76, kcal: 2000, load: "rest", cutting: true });
    expect(rest.carbs).toMatchObject({ low: 152, high: 228 });
    expect(rest.protein).toMatchObject({ low: 137, high: 182 });
    // Never below the 130 g floor, even for a light body on a rest day.
    expect(
      macroBands({ kg: 40, kcal: 1600, load: "rest", cutting: false }).carbs,
    ).toMatchObject({
      low: 130,
      high: 130,
    });
  });

  it("training load from the day's minutes: an hour's run is training, not long", () => {
    expect(trainingLoad(0, 0)).toBe("rest");
    expect(trainingLoad(60, 60)).toBe("training");
    expect(trainingLoad(125, 0)).toBe("long");
    expect(trainingLoad(95, 90)).toBe("long");
  });
});

describe("zones", () => {
  const health: Band = {
    floor: 100,
    low: 120,
    high: 160,
    ceiling: 200,
    ceilingKind: "health",
  };
  const useful: Band = { ...health, ceiling: 160, ceilingKind: "useful" };
  it("names the zone", () => {
    expect([90, 110, 140, 180, 210].map((v) => zoneOf(v, health))).toEqual([
      "below_floor",
      "low",
      "good",
      "high",
      "above_ceiling",
    ]);
  });
  it("100 in the good zone, 50 at the floor; past a health max down to 0, past a useful max 70", () => {
    expect(zoneScore(140, health)).toBe(100);
    expect(zoneScore(100, health)).toBe(50);
    expect(zoneScore(110, health)).toBe(75);
    expect(zoneScore(200, health)).toBe(50);
    expect(zoneScore(80, health)).toBe(0);
    expect(zoneScore(240, health)).toBe(0);
    expect(zoneScore(400, useful)).toBe(70);
  });
});

describe("bandFor and bandState (colour = state)", () => {
  it("energy: good within ±5 % of the target, over past +10 %", () => {
    const b = bandFor(undefined, 2000, "target");
    expect(bandState(1800, b)).toBe("short");
    expect(bandState(1950, b)).toBe("good");
    expect(bandState(2150, b)).toBe("high");
    expect(bandState(2300, b)).toBe("over");
  });

  it("a maximum is good up to it; a minimum is never 'over'", () => {
    expect(bandState(5, bandFor(undefined, 5, "max"))).toBe("good");
    expect(bandState(6, bandFor(undefined, 5, "max"))).toBe("over");
    expect(bandState(80, bandFor(undefined, 30, "min"))).toBe("high");
  });

  it("a macro's own band wins; no band and no target says nothing", () => {
    const own: Band = {
      floor: 10,
      low: 20,
      high: 30,
      ceiling: 40,
      ceilingKind: "health",
    };
    expect(bandFor(own, 999, "target")).toBe(own);
    expect(bandState(100, bandFor(undefined, null, "target"))).toBe("none");
    expect(bandState(100, bandFor(undefined, 0, "target"))).toBe("none");
  });
});
