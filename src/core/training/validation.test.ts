/** Tests for core/training/validation.ts (ADR-0005). */
import { describe, expect, it } from "vitest";
import { parseInput } from "../shared/validation";
import { checkSetsForKinds, exerciseInput, sessionInput } from "./validation";

const ex = crypto.randomUUID();

describe("exerciseInput", () => {
  it("keeps known muscle groups in order, once, and reads the checkbox", () => {
    const r = parseInput(exerciseInput, {
      name: " Lat pulldown ",
      kind: "strength",
      muscleGroups: "lats, biceps,lats",
      pattern: "vertical_pull",
      unilateral: "on",
    });
    expect(
      r.ok && [
        r.value.name,
        r.value.muscleGroups,
        r.value.pattern,
        r.value.unilateral,
        r.value.equipment,
      ],
    ).toEqual(["Lat pulldown", ["lats", "biceps"], "vertical_pull", true, null]);
  });

  it("refuses groups and patterns outside the lists; no pattern is null", () => {
    expect(
      parseInput(exerciseInput, {
        name: "X",
        kind: "strength",
        muscleGroups: "dorsali",
        pattern: "yoga",
      }),
    ).toEqual({
      ok: false,
      errors: { muscleGroups: "invalid_choice", pattern: "invalid_choice" },
    });
    const r = parseInput(exerciseInput, { name: "X", kind: "cardio", pattern: "" });
    expect(r.ok && r.value.pattern).toBeNull();
  });

  it("refuses an unknown kind", () => {
    expect(parseInput(exerciseInput, { name: "X", kind: "yoga" })).toEqual({
      ok: false,
      errors: { kind: "invalid_choice" },
    });
  });
});

describe("sessionInput", () => {
  const base = {
    day: "2026-09-28",
    label: "PULL 4",
    status: "done",
    time: "11:27",
    durationMin: "60",
  };

  it("parses a session with sets (loads as decimals, as written)", () => {
    const r = parseInput(sessionInput, {
      ...base,
      exercises: JSON.stringify([
        {
          exerciseId: ex,
          notes: "sento le braccia",
          sets: [{ reps: 7, loadKg: "34,5", loadText: "2×10 + asta", loadApprox: true }],
        },
      ]),
    });
    expect(r.ok && r.value.exercises[0]!.sets[0]).toMatchObject({
      reps: 7,
      loadKg: "34.5",
      loadText: "2×10 + asta",
      loadApprox: true,
    });
    expect(r.ok && [r.value.time, r.value.durationMin, r.value.routineId]).toEqual([
      "11:27",
      60,
      null,
    ]);
  });

  it("refuses too many decimals in a load", () => {
    const r = parseInput(sessionInput, {
      ...base,
      exercises: JSON.stringify([
        { exerciseId: ex, sets: [{ reps: 5, loadKg: "12.345" }] },
      ]),
    });
    expect(r.ok ? {} : r.errors).toEqual({
      "exercises.0.sets.0.loadKg": "too_many_decimals",
    });
  });
});

describe("checkSetsForKinds", () => {
  const set = (v: object) => ({
    reps: null,
    loadKg: null,
    loadText: null,
    loadApprox: false,
    durationS: null,
    distanceM: null,
    speedKmh: null,
    inclinePct: null,
    restS: null,
    warmup: false,
    ...v,
  });

  it("strength needs reps and load, bodyweight reps, cardio a duration", () => {
    expect(
      checkSetsForKinds(
        [
          { sets: [set({ reps: 10 })] },
          { sets: [set({ loadKg: "5" })] },
          { sets: [set({ distanceM: 1000 })] },
        ],
        ["strength", "bodyweight", "cardio"],
      ),
    ).toEqual({
      "exercises.0.sets.0.loadKg": "required",
      "exercises.1.sets.0.reps": "required",
      "exercises.2.sets.0.durationS": "required",
    });
    expect(
      checkSetsForKinds([{ sets: [set({ reps: 10, loadKg: "60" })] }], ["strength"]),
    ).toBeNull();
  });
});

describe("checkSetsForKinds and planned sets", () => {
  it("a planned set (done: false) may be incomplete; a done one may not", () => {
    expect(
      checkSetsForKinds(
        [{ sets: [{ reps: null, loadKg: null, durationS: null, done: false }] }],
        ["cardio"],
      ),
    ).toBeNull();
    expect(
      checkSetsForKinds(
        [{ sets: [{ reps: null, loadKg: null, durationS: null }] }],
        ["cardio"],
      ),
    ).toEqual({ "exercises.0.sets.0.durationS": "required" });
  });
});
