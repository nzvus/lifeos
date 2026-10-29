import { describe, expect, it } from "vitest";
import type { DoneSet, GymExercise } from "./Gym";
import { restAfterLast } from "./gym-parts";

const set = (position: number, endedAt: number, warmup = false): DoneSet => ({
  position,
  reps: 10,
  loadKg: "50",
  rir: null,
  durationS: null,
  warmup,
  loadEntry: "total",
  assumed: false,
  restBeforeS: null,
  endedAt,
});
const ex = (done: DoneSet[], sets = 3) =>
  ({
    entryId: "e",
    proposed: Array.from({ length: sets }, () => ({
      reps: 10,
      loadKg: "50",
      durationS: null,
    })),
    restS: 78,
    restWords: "tua media 78 s",
    done,
  }) as unknown as GymExercise;
const s = { warmupRestS: 59, transitionS: 90 };

describe("a reload resumes the rest (session.md §8.5)", () => {
  const t0 = 1_000_000;
  it("40 s into a 78 s rest → the same rest, from the set's end", () => {
    expect(restAfterLast([ex([set(0, t0)])], s, t0 + 40_000)).toEqual({
      from: t0,
      seconds: 78,
      words: "tua media 78 s",
    });
  });
  it("after a warm-up its own rest; after the last set the change of exercise", () => {
    expect(restAfterLast([ex([set(0, t0, true)])], s, t0 + 1000)?.seconds).toBe(59);
    expect(
      restAfterLast([ex([set(0, t0 - 9e4), set(1, t0 - 5e4), set(2, t0)])], s, t0 + 1000)
        ?.seconds,
    ).toBe(90);
  });
  it("long after the rest ended → nothing to resume", () => {
    expect(restAfterLast([ex([set(0, t0)])], s, t0 + 10 * 60_000)).toBeNull();
    expect(restAfterLast([ex([])], s, t0)).toBeNull();
  });
});
