import { describe, expect, it } from "vitest";
import { bestE1rm, recordsOf, type ExerciseSession } from "./log";

describe("an exercise's log", () => {
  it("keeps the best e1RM of the sets with reps and a load", () => {
    expect(
      bestE1rm([
        { reps: 8, loadKg: "60.00", rir: 2 },
        { reps: 5, loadKg: "70.00", rir: 0 },
        { reps: null, loadKg: "80.00", rir: null },
      ]),
    ).toBeCloseTo(81.67, 2);
    expect(bestE1rm([{ reps: 20, loadKg: "10", rir: null }])).toBeNull();
  });
});

describe("an exercise's records (TR-23)", () => {
  const s = (day: string, sets: [number, string | null][]): ExerciseSession => {
    const own = sets.map(([reps, loadKg]) => ({ reps, loadKg, rir: null }));
    return { day, sets: own, best: bestE1rm(own) };
  };
  it("none before its 3rd session", () => {
    expect(
      recordsOf([s("2026-11-01", [[10, "40"]]), s("2026-11-03", [[10, "40"]])]),
    ).toBeNull();
  });
  it("forza stimata, carico massimo and the most reps at his usual load, each with its day", () => {
    const r = recordsOf([
      s("2026-11-07", [
        [6, "45"],
        [9, "40"],
      ]),
      s("2026-11-03", [
        [12, "40"],
        [10, "40"],
      ]),
      s("2026-11-01", [
        [10, "40"],
        [9, "40"],
      ]),
    ]);
    // 12 × 40: 40 × 1,4 = 56; 6 × 45 = 54.
    expect(r?.e1rm).toEqual({ kg: 56, day: "2026-11-03" });
    expect(r?.load).toEqual({ kg: 45, reps: 6, day: "2026-11-07" });
    // 40 kg in three sessions, 45 kg in one: «record a 40 kg» = 12.
    expect(r?.repsAt).toEqual({ kg: 40, reps: 12, day: "2026-11-03" });
  });
  it("corpo libero: the most reps, no load", () => {
    const r = recordsOf([
      s("2026-11-01", [[10, null]]),
      s("2026-11-03", [[12, null]]),
      s("2026-11-05", [[11, null]]),
    ]);
    expect(r).toEqual({
      e1rm: null,
      load: null,
      repsAt: { kg: null, reps: 12, day: "2026-11-03" },
    });
  });
});
