/** Tests for core/training/weighIns.ts (ADR-0027). */
import { describe, expect, it } from "vitest";
import {
  plausibleMeasurements,
  bodyIndices,
  implausibleWeighIns,
  plausibleGap,
  readWeighIn,
  type WeighInFacts,
  weightTrend,
} from "./weighIns";

const facts = (f: Partial<WeighInFacts> = {}): WeighInFacts => ({
  said: null,
  hour: null,
  ateBeforeKcal: 0,
  trainedBefore: false,
  yesterday: null,
  usual: null,
  ...f,
});

describe("readWeighIn", () => {
  it("a weigh-in said to be fasted, after the toilet, in the morning is standard", () => {
    expect(
      readWeighIn(
        facts({
          said: { fasted: true, afterToilet: true, afterTraining: false },
          hour: 7,
        }),
      ),
    ).toEqual({ clues: [], reliability: 1 });
  });

  it("nothing said and nothing against it: unknown", () => {
    expect(readWeighIn(facts())).toEqual({ clues: [], reliability: 0.75 });
  });

  it("derives food and training before it, and the hour", () => {
    const r = readWeighIn(facts({ hour: 20, ateBeforeKcal: 1800, trainedBefore: true }));
    expect(r.clues).toEqual(["after_food", "after_training", "late"]);
    expect(r.reliability).toBe(0.25); // 0.75 × 0.5 × 0.6 × 0.7, floored
  });

  it("a coffee is not 'after food'; what the user said wins either way", () => {
    expect(readWeighIn(facts({ ateBeforeKcal: 40 })).clues).toEqual([]);
    expect(
      readWeighIn(
        facts({ said: { fasted: false, afterToilet: false, afterTraining: true } }),
      ).clues,
    ).toEqual(["after_food", "after_training", "before_toilet"]);
  });

  it("yesterday's carbs and salt against the usual day: likely water", () => {
    const usual = { carbs: 250, salt: 5 };
    expect(
      readWeighIn(facts({ yesterday: { carbs: 400, salt: 8 }, usual })).clues,
    ).toEqual(["carbs_up", "salt_up"]);
    expect(
      readWeighIn(facts({ yesterday: { carbs: 120, salt: 5 }, usual })).clues,
    ).toEqual(["carbs_down"]);
    expect(
      readWeighIn(facts({ yesterday: { carbs: 270, salt: 5.5 }, usual })).clues,
    ).toEqual([]);
  });
});

describe("readWeighIn: sleep (ADR-0031)", () => {
  it("a night under 6 h is a clue; 7 h or nothing logged is not", () => {
    expect(readWeighIn(facts({ sleptHours: 5.5 }))).toEqual({
      clues: ["short_night"],
      reliability: 0.68, // 0.75 × 0.9
    });
    expect(readWeighIn(facts({ sleptHours: 7 })).clues).toEqual([]);
    expect(readWeighIn(facts({ sleptHours: null })).clues).toEqual([]);
  });
});

describe("weightTrend", () => {
  it("smooths daily swings, and an unreliable weigh-in pulls less", () => {
    const t = weightTrend([
      { day: "2026-10-01", kg: 76, reliability: 1 },
      { day: "2026-10-02", kg: 78, reliability: 1 }, // +2 kg overnight: water
      { day: "2026-10-03", kg: 78, reliability: 0.25 },
    ]);
    expect(t).toEqual([76, 76.2, 76.25]);
  });

  it("a weigh-in a week after the last pulls more than one a day after", () => {
    const daily = weightTrend([
      { day: "2026-10-01", kg: 76, reliability: 1 },
      { day: "2026-10-02", kg: 75, reliability: 1 },
    ]);
    const weekly = weightTrend([
      { day: "2026-10-01", kg: 76, reliability: 1 },
      { day: "2026-10-08", kg: 75, reliability: 1 },
    ]);
    expect(daily[1]).toBe(75.9);
    expect(weekly[1]).toBeLessThan(75.6);
  });
});

describe("bodyIndices", () => {
  it("BMI with its WHO category, waist-to-height and FFMI", () => {
    expect(bodyIndices({ kg: 76, heightCm: 178, waistCm: 82, bodyFatPct: 15 })).toEqual({
      bmi: { value: 24, category: "normal" },
      waistToHeight: 0.46,
      ffmi: 20.5,
    });
  });

  it("each index is null without its inputs", () => {
    expect(bodyIndices({ kg: 76, heightCm: null, waistCm: 82, bodyFatPct: 15 })).toEqual({
      bmi: null,
      waistToHeight: null,
      ffmi: null,
    });
    expect(
      bodyIndices({ kg: 96, heightCm: 178, waistCm: null, bodyFatPct: null }).bmi,
    ).toEqual({ value: 30.3, category: "obese" });
  });
});

describe("implausibleWeighIns", () => {
  it("flags the 2026-10-08 typo, and compares the next weigh-in with the one before it", () => {
    const flags = implausibleWeighIns([
      { day: "2026-10-06", kg: 75.4 },
      { day: "2026-10-07", kg: 76.4 },
      { day: "2026-10-08", kg: 86.0 }, // typed for 76.00
      { day: "2026-10-09", kg: 76.2 },
    ]);
    expect(flags).toEqual([false, false, true, false]);
  });

  it("accepts real change over a longer gap", () => {
    expect(
      implausibleWeighIns([
        { day: "2026-01-01", kg: 80 },
        { day: "2026-02-15", kg: 74 },
      ]),
    ).toEqual([false, false]);
    expect(plausibleGap(76, 1)).toBe(2.5);
  });

  it("reads a flagged weigh-in as all but ignored", () => {
    const r = readWeighIn({
      said: { fasted: true, afterToilet: true, afterTraining: false },
      hour: 8,
      ateBeforeKcal: 0,
      trainedBefore: false,
      yesterday: null,
      usual: null,
      implausible: true,
    });
    expect(r).toEqual({ clues: ["implausible"], reliability: 0.02 });
  });
});

describe("plausibleMeasurements", () => {
  it("leaves out a typo far from the weigh-ins before it (2026-10-08: 86 for 76)", () => {
    const m = [
      { day: "2026-10-07", weightKg: "76.40" },
      { day: "2026-10-08", weightKg: "86.00" },
      { day: "2026-10-06", weightKg: "75.40" },
      { day: "2026-10-09", weightKg: null },
    ];
    expect(plausibleMeasurements(m).map((x) => x.day)).toEqual([
      "2026-10-07",
      "2026-10-06",
      "2026-10-09",
    ]);
  });
});
