/** Tests for core/training/live.ts: the gym mode of a session. */
import { describe, expect, it } from "vitest";
import { parseInput } from "../shared/validation";
import {
  baselineSet,
  copyLastSet,
  move,
  newExercise,
  restoreSet,
  setChange,
  finished,
  minutesSince,
  nextSet,
  stepLoad,
  toSessionValues,
  undoneCount,
  type LiveSession,
  type LiveSet,
} from "./live";
import { sessionInput } from "./validation";

const set = (reps: number, loadKg: string, done = false): LiveSet => ({
  reps,
  loadKg,
  loadText: null,
  loadApprox: false,
  durationS: null,
  distanceM: null,
  speedKmh: null,
  inclinePct: null,
  restS: null,
  warmup: false,
  done,
});
const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const session = (sets1: LiveSet[], sets2: LiveSet[]): LiveSession => ({
  day: "2026-10-01",
  label: "Pull",
  time: "18:05",
  routineId: null,
  notes: "",
  exercises: [
    { exerciseId: id(1), restS: 110, notes: "", sets: sets1 },
    { exerciseId: id(2), restS: null, notes: "", sets: sets2 },
  ],
});

describe("live mode", () => {
  it("the next set is the first one not done", () => {
    expect(
      nextSet(session([set(10, "35", true), set(8, "35")], [set(10, "20")]).exercises),
    ).toEqual({
      exercise: 0,
      set: 1,
    });
    expect(nextSet(session([set(10, "35", true)], [set(10, "20")]).exercises)).toEqual({
      exercise: 1,
      set: 0,
    });
    expect(nextSet(session([set(10, "35", true)], []).exercises)).toBeNull();
  });

  it("steps loads by 2.5 kg on plates and 1 kg below 20, never below 0", () => {
    expect(stepLoad("35", 1)).toBe("37.5");
    expect(stepLoad("20", -1)).toBe("19");
    expect(stepLoad("22.5", -1)).toBe("20");
    expect(stepLoad("17.5", 1)).toBe("18.5");
    expect(stepLoad("0.5", -1)).toBe("0");
    expect(stepLoad(null, 1)).toBe("1");
  });

  it("a new set copies the last one, not done", () => {
    const e = session([set(8, "35", true)], []).exercises[0]!;
    expect(copyLastSet(e)).toEqual(set(8, "35"));
  });

  it("minutes since the start, at least 1", () => {
    expect(minutesSince("18:05", "19:02")).toBe(57);
    expect(minutesSince("18:05", "18:05")).toBe(1);
    expect(minutesSince("", "19:00")).toBeNull();
  });

  it("finishing keeps only what was done, and the result is a valid session", () => {
    const s = session([set(10, "35", true), set(8, "35")], [set(10, "20")]);
    expect(undoneCount(s)).toBe(2);
    const values = finished(s, "19:02");
    const r = parseInput(sessionInput, values);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([r.value.status, r.value.durationMin]).toEqual(["done", 57]);
    expect(r.value.exercises).toHaveLength(1);
    expect(r.value.exercises[0]!.sets.map((x) => [x.reps, x.loadKg, x.done])).toEqual([
      [10, "35", true],
    ]);
  });

  it("saving while planned keeps every set with its done flag", () => {
    const s = session([set(10, "35", true), set(8, "35")], []);
    const r = parseInput(sessionInput, toSessionValues(s, "planned", null));
    expect(r.ok && r.value.exercises.flatMap((e) => e.sets.map((x) => x.done))).toEqual([
      true,
      false,
    ]);
  });

  it("compares a set with the same set of last time, else its last one", () => {
    const base = [set(10, "40"), set(9, "40")];
    expect(baselineSet(base, 1)).toEqual(set(9, "40"));
    expect(baselineSet(base, 3)).toEqual(set(9, "40"));
    expect(baselineSet([], 0)).toBeNull();
    // 10 × 42.5 against 10 × 40: +6 %; 8 × 40 against 9 × 40: −11 %.
    expect(setChange("strength", set(10, "42.5"), set(10, "40"))).toBe(6);
    expect(setChange("strength", set(8, "40"), set(9, "40"))).toBe(-11);
    expect(setChange("strength", set(8, "40"), null)).toBeNull();
    // Bodyweight without a load: reps alone.
    const bw = (reps: number) => ({ ...set(reps, "0"), loadKg: null });
    expect(setChange("bodyweight", bw(12), bw(10))).toBe(20);
    // Cardio: distance when both have it.
    const run = (m: number, s: number) => ({
      ...set(0, "0"),
      reps: null,
      loadKg: null,
      distanceM: m,
      durationS: s,
    });
    expect(setChange("cardio", run(5500, 1800), run(5000, 1800))).toBe(10);
  });

  it("restores the numbers of last time, keeping the tick", () => {
    expect(restoreSet(set(12, "45", true), set(10, "40"))).toEqual(set(10, "40", true));
  });

  it("moves exercises one place, not past the ends", () => {
    expect(move(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(move(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(move(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
  });

  it("a new exercise starts from last time's sets, not done", () => {
    expect(newExercise(id(3), 90, [set(10, "20", true)]).sets).toEqual([set(10, "20")]);
    expect(newExercise(id(3), null, undefined).sets).toHaveLength(1);
  });
});
