/** Tests for core/training/targets.ts and guides.ts (ADR-0028). */
import { describe, expect, it } from "vitest";
import { GUIDES, guideKeyOf } from "./guides";
import { bestSet, nextTarget, type LastSet } from "./targets";

const set = (
  reps: number | null,
  loadKg: string | null,
  extra: Partial<LastSet> = {},
): LastSet => ({
  reps,
  loadKg,
  durationS: null,
  warmup: false,
  ...extra,
});

describe("guideKeyOf", () => {
  it("uses the pattern, else what the name suggests, else none", () => {
    expect(guideKeyOf({ pattern: "squat", name: "Whatever" })).toBe("squat");
    expect(guideKeyOf({ pattern: null, name: "Lat pulldown" })).toBe("vertical_pull");
    expect(guideKeyOf({ pattern: "other", name: "Machine chest press" })).toBe(
      "horizontal_press",
    );
    expect(guideKeyOf({ pattern: null, name: "Juggling" })).toBeNull();
  });

  it("every guide has sane ranges", () => {
    for (const g of Object.values(GUIDES)) {
      expect(g.reps[0]).toBeLessThanOrEqual(g.reps[1]);
      expect(g.sets[0]).toBeLessThanOrEqual(g.sets[1]);
      expect(g.restS[0]).toBeLessThanOrEqual(g.restS[1]);
    }
  });
});

describe("nextTarget: double progression", () => {
  const pull = GUIDES.vertical_pull; // 8–12

  it("all working sets at the top: one load step up, back to the bottom", () => {
    expect(nextTarget(pull, [set(12, "40"), set(12, "40"), set(12, "40")])).toEqual({
      reason: "add_load",
      sets: 3,
      reps: [8, 12],
      loadKg: "42.5",
    });
  });

  it("not there yet: same load, one more rep on the weakest set; warm-ups ignored", () => {
    expect(
      nextTarget(pull, [set(10, "20", { warmup: true }), set(11, "40"), set(9, "40")]),
    ).toEqual({ reason: "add_reps", sets: 2, reps: [10, 12], loadKg: "40" });
  });

  it("sets at different loads: progress from the heaviest", () => {
    expect(nextTarget(pull, [set(10, "40"), set(9, "42.5")])).toEqual({
      reason: "add_reps",
      sets: 2,
      reps: [10, 12],
      loadKg: "42.5",
    });
  });

  it("below the range: hold the load and aim for the bottom", () => {
    expect(nextTarget(pull, [set(6, "50")])).toMatchObject({
      reason: "hold",
      reps: [8, 12],
    });
  });

  it("no history: the range and a reasonable effort", () => {
    expect(nextTarget(pull, undefined)).toEqual({
      reason: "start",
      sets: 3,
      reps: [8, 12],
    });
  });

  it("bodyweight moves by reps, then asks for load or a harder variant", () => {
    const raise = GUIDES.leg_raise; // 8–15, by reps
    expect(nextTarget(raise, [set(10, null), set(9, null)])).toMatchObject({
      reason: "add_reps",
      reps: [10, 15],
    });
    expect(nextTarget(raise, [set(15, null), set(15, null)])).toMatchObject({
      reason: "add_load",
      loadKg: null,
    });
  });

  it("cardio and planks move by time, about 10 %", () => {
    expect(nextTarget(GUIDES.run, [set(null, null, { durationS: 30 * 60 })])).toEqual({
      reason: "add_time",
      sets: 1,
      minutes: 33,
    });
    expect(nextTarget(GUIDES.plank, [set(null, null, { durationS: 40 })])).toMatchObject({
      reason: "add_time",
      seconds: 44,
    });
  });
});

describe("bestSet", () => {
  it("the heaviest by Epley's estimated 1RM, warm-ups and bodyweight ignored", () => {
    expect(
      bestSet([
        set(10, "40"),
        set(5, "50"),
        set(10, "30", { warmup: true }),
        set(12, null),
      ]),
    ).toEqual({
      reps: 5,
      kg: 50,
      e1rm: 58.3,
    });
  });
});
