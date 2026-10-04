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
  addWarmup,
  warmupSet,
  clockOf,
  startNext,
  completeRunning,
  timing,
  activeMinutes,
  toggleDone,
  routineItemsOf,
  type LiveExercise,
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
  startedAt: null,
  endedAt: null,
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

describe("warm-up (gym mode)", () => {
  it("adds the ramp 50 % × 8, 70 % × 5, 85 % × 3 of the first working load, before the working sets", () => {
    let e: LiveExercise = {
      exerciseId: "x",
      restS: 90,
      notes: "",
      sets: [set(8, "62.5"), set(8, "62.5")],
    };
    e = addWarmup(e);
    e = addWarmup(e);
    e = addWarmup(e);
    expect(e.sets.map((x) => [x.warmup, x.reps, x.loadKg])).toEqual([
      [true, 8, "30"], // 31.25 down to its 2.5 step
      [true, 5, "42.5"],
      [true, 3, "52.5"],
      [false, 8, "62.5"],
      [false, 8, "62.5"],
    ]);
  });

  it("without a load, half the working reps", () => {
    const e = {
      exerciseId: "x",
      restS: 90,
      notes: "",
      sets: [{ ...set(12, "0"), loadKg: null }],
    };
    expect(warmupSet(e)).toMatchObject({
      reps: 6,
      loadKg: null,
      warmup: true,
      done: false,
    });
  });
});

describe("the clock (rest → Go → set → ✓)", () => {
  const T = (m: number, s = 0) =>
    `2026-10-04T18:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.000Z`;
  const two = () => session([set(10, "35"), set(10, "35")], [set(8, "20")]);
  const never = () => false;

  it("is idle before anything, then follows Go and ✓, resting the exercise's rest", () => {
    let s = two();
    expect(clockOf(s)).toEqual({ phase: "idle" });
    s = startNext(s, T(0));
    expect(clockOf(s)).toMatchObject({ phase: "set", since: T(0), exercise: 0, set: 0 });
    s = completeRunning(s, T(0, 40), never);
    expect(s.exercises[0]!.sets[0]).toMatchObject({
      done: true,
      startedAt: T(0),
      endedAt: T(0, 40),
    });
    expect(clockOf(s)).toEqual({
      phase: "rest",
      since: T(0, 40),
      restS: 110,
      half: false,
    });
    s = startNext(s, T(3));
    expect(clockOf(s)).toMatchObject({ phase: "set", exercise: 0, set: 1 });
  });

  it("splits a set of an exercise done one side at a time, with half the rest between", () => {
    const uni = () => true;
    let s = startNext(two(), T(0));
    s = completeRunning(s, T(0, 30), uni);
    expect(clockOf(s)).toEqual({ phase: "rest", since: T(0, 30), restS: 55, half: true });
    s = startNext(s, T(1, 30));
    expect(clockOf(s)).toMatchObject({ phase: "set", since: T(1, 30), side: 2 });
    s = completeRunning(s, T(2), uni);
    expect(s.exercises[0]!.sets[0]).toMatchObject({
      done: true,
      startedAt: T(0),
      endedAt: T(2),
    });
    expect(clockOf(s)).toMatchObject({ phase: "rest", restS: 110, half: false });
  });

  it("measures work, rest and the long breaks (the app closed), and the active minutes", () => {
    let s = startNext(two(), T(0));
    s = completeRunning(s, T(1), never);
    s = startNext(s, T(3));
    s = completeRunning(s, T(4), never);
    s = startNext(s, T(30)); // 26 minutes away
    s = completeRunning(s, T(31), never);
    expect(timing(s)).toEqual({
      workS: 180,
      restS: 1680,
      sets: 3,
      avgRestS: 840,
      longBreaks: [1560],
    });
    expect(activeMinutes(s)).toBe(31);
    const r = parseInput(sessionInput, finished(s, "23:59"));
    expect(r.ok && r.value.durationMin).toBe(31);
  });

  it("a tick by hand marks the end, and unticking clears it", () => {
    const s = toggleDone(two(), 0, 0, T(5));
    expect(s.exercises[0]!.sets[0]).toMatchObject({
      done: true,
      startedAt: null,
      endedAt: T(5),
    });
    expect(toggleDone(s, 0, 0, T(6)).exercises[0]!.sets[0]).toMatchObject({
      done: false,
      endedAt: null,
    });
  });
});

describe("routineItemsOf", () => {
  it("keeps each exercise's working sets as a count with the first set's numbers", () => {
    const s = session(
      [{ ...set(8, "20"), warmup: true }, set(10, "35"), set(8, "37.5")],
      [],
    );
    expect(routineItemsOf(s)).toEqual([
      { exerciseId: id(1), sets: 2, reps: 10, loadKg: "35", durationS: null, restS: 110 },
    ]);
  });
});
