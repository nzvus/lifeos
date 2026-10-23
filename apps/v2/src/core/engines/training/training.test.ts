import { describe, expect, it } from "vitest";
import { addDays } from "../time/date";
import { deloadSuggestion, expectedSetS, readiness, restAfter } from "./rests";
import type { SetForFlags } from "./sets";
import { duplicateSessions, e1rm, setFlags, totalLoad } from "./sets";

describe("e1RM with effort", () => {
  it("Epley with reps in reserve; without RIR, Epley on reps; 1–12 reps only", () => {
    expect(e1rm(8, 80, 2)).toBeCloseTo(106.67, 2); // 80 × (1 + 10/30)
    expect(e1rm(8, 80)).toBeCloseTo(101.33, 2);
    expect(e1rm(13, 80)).toBeNull();
    expect(e1rm(0, 80)).toBeNull();
    expect(e1rm(5, 0)).toBeNull();
  });
  it("a load is stored as the total: per dumbbell and per side count twice", () => {
    expect(totalLoad({ kg: 22.5, as: "perDumbbell" })).toBe(45);
    expect(totalLoad({ kg: 30, as: "perSide" })).toBe(60);
    expect(totalLoad({ kg: 100, as: "total" })).toBe(100);
  });
});

describe("flags asked before saving", () => {
  const set = (
    exercise: string,
    reps: number,
    kg: number,
    muscles = ["chest"],
  ): SetForFlags => ({
    exercise,
    muscles,
    reps,
    kg,
  });
  it("a jump of 60 % or more on the trend: per dumbbell or total?", () => {
    const trend = new Map([["press", 40]]);
    // 22.5 per dumbbell typed as a total of 45 would be fine; 70 is not.
    expect(setFlags([set("press", 8, 30)], trend)).toEqual([]);
    expect(setFlags([set("press", 8, 60)], trend)).toEqual([
      { type: "jump", exercise: "press", byPct: 90 }, // e1RM 8 × 60 = 76 against 40
    ]);
  });
  it("reps beyond what the load allows", () => {
    const trend = new Map([["squat", 120]]);
    // At 100 kg, the trend allows ≈ 6 reps to failure: 30 is implausible, 10 is a good day.
    expect(setFlags([set("squat", 10, 100, ["quads"])], trend)).toEqual([]);
    expect(setFlags([set("squat", 30, 100, ["quads"])], trend)).toEqual([
      { type: "implausibleReps", exercise: "squat", reps: 30, plausibleMax: 12 },
    ]);
  });
  it("tonnage out of proportion with the session's exercises for the same muscles", () => {
    const sets = [
      set("bench", 8, 60),
      set("incline", 10, 40),
      set("fly", 12, 14),
      set("dips", 10, 400),
    ];
    expect(setFlags(sets, new Map())).toEqual([
      { type: "tonnage", exercise: "dips", perSet: 4000, medianPerSet: 400 },
    ]);
  });
  it("warm-ups are not checked; a new exercise has no trend to jump from", () => {
    expect(
      setFlags([{ ...set("press", 8, 99), warmup: true }], new Map([["press", 40]])),
    ).toEqual([]);
    expect(setFlags([set("new", 8, 200)], new Map())).toEqual([]);
  });
  it("duplicated sessions: same day, routine and sets", () => {
    const sets = [{ exercise: "bench", reps: 8, kg: 60 }];
    const flags = duplicateSessions([
      { id: "a", day: "2026-10-17", routine: "push", sets },
      { id: "b", day: "2026-10-17", routine: "push", sets },
      { id: "c", day: "2026-10-18", routine: "push", sets },
    ]);
    expect(flags).toEqual([{ type: "duplicate", session: "b", of: "a" }]);
  });
});

describe("rests", () => {
  it("heavy compounds 2–3 min, other compounds 90–120 s, isolation 60–90 s", () => {
    expect(restAfter({ role: "compound", reps: 5 })).toEqual({ low: 120, high: 180 });
    expect(restAfter({ role: "compound", reps: 8, intensity: 0.86 })).toEqual({
      low: 120,
      high: 180,
    });
    expect(restAfter({ role: "compound", reps: 10 })).toEqual({ low: 90, high: 120 });
    expect(restAfter({ role: "isolation", reps: 12 })).toEqual({ low: 60, high: 90 });
  });
  it("between sides 0–15 s; after a warm-up 30 / 45 / 60 s by the ramp", () => {
    expect(restAfter({ role: "isolation", reps: 12, otherSide: true })).toEqual({
      low: 0,
      high: 15,
    });
    const ramp = [0, 1, 2].map((index) =>
      restAfter({ role: "compound", reps: 5, warmup: { index, of: 3 } }),
    );
    expect(ramp).toEqual([
      { low: 30, high: 30 },
      { low: 45, high: 45 },
      { low: 60, high: 60 },
    ]);
  });
});

describe("gym mode's timing", () => {
  it("reps × the exercise's learnt seconds per rep, plus the setup", () => {
    const timed = [
      { reps: 10, seconds: 30 },
      { reps: 8, seconds: 28 },
      { reps: 6, seconds: 24 },
    ];
    expect(expectedSetS({ reps: 10, role: "compound", timed })).toEqual({
      seconds: 45,
      learnt: true,
    });
    expect(expectedSetS({ reps: 10, role: "compound", timed: [] })).toEqual({
      seconds: 45,
      learnt: false,
    });
    expect(
      expectedSetS({ reps: 12, role: "isolation", timed: [], setupS: 5 }).seconds,
    ).toBe(38);
  });
});

describe("readiness (v1 ADR-0049)", () => {
  it("a short night, low energy or high stress", () => {
    expect(readiness({ sleptHours: 5.5, energy: 2, stress: 4 })).toEqual([
      "short_night",
      "low_energy",
      "high_stress",
    ]);
    expect(readiness({ sleptHours: 7, energy: 3, stress: 3 })).toEqual([]);
    expect(readiness({ sleptHours: null, energy: null, stress: null })).toEqual([]);
  });
});

describe("deload suggestion", () => {
  const today = "2026-10-17";
  const falling = (from: number) =>
    [0, 5, 10, 14].map((d, i) => ({ day: addDays(today, d - 14), kg: from - i * 2 }));
  const e1rmBy = new Map([
    ["squat", falling(140)],
    ["bench", falling(100)],
    ["row", falling(90)],
    ["curl", [0, 5, 10, 14].map((d) => ({ day: addDays(today, d - 14), kg: 40 }))],
  ]);
  it("e1RM falling on several exercises for two weeks, with low recovery", () => {
    expect(
      deloadSuggestion({ today, e1rm: e1rmBy, lowRecoveryDays: 6, weeklySets: [] }),
    ).toEqual({
      type: "falling",
      exercises: ["bench", "row", "squat"],
    });
    expect(
      deloadSuggestion({ today, e1rm: e1rmBy, lowRecoveryDays: 2, weeklySets: [] }),
    ).toBeNull();
  });
  it("after six weeks of rising volume", () => {
    const rising = [40, 42, 44, 46, 48, 50, 52];
    expect(
      deloadSuggestion({
        today,
        e1rm: new Map(),
        lowRecoveryDays: 0,
        weeklySets: rising,
      }),
    ).toEqual({
      type: "volume",
      weeks: 6,
    });
    expect(
      deloadSuggestion({
        today,
        e1rm: new Map(),
        lowRecoveryDays: 0,
        weeklySets: [40, 42, 41, 44, 46],
      }),
    ).toBeNull();
  });
});
