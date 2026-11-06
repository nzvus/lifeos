import { describe, expect, it } from "vitest";
import type { GymExercise } from "./Gym";
import { afterSet, antagonists, canPair, SUPERSET_SWITCH_S } from "./superset";

const ex = (
  entryId: string,
  muscles: string[],
  done: number,
  more: Partial<GymExercise> = {},
) =>
  ({
    entryId,
    name: entryId,
    muscles,
    partner: null,
    skipped: false,
    restS: 90,
    restWords: "tua media",
    proposed: [{}, {}, {}],
    done: Array.from({ length: done }, () => ({ warmup: false })),
    ...more,
  }) as unknown as GymExercise;
const times = { warmupRestS: 59, transitionS: 120 };

describe("supersets (session.md §5.2)", () => {
  it("only exercises sharing no muscle; chest–back and biceps–triceps are antagonists", () => {
    const bench = ex("panca", ["chest", "triceps"], 0);
    const row = ex("rematore", ["upper_back", "biceps"], 0);
    const dips = ex("dip", ["triceps", "chest"], 0);
    expect(canPair(bench, row)).toBe(true);
    expect(antagonists(bench, row)).toBe(true);
    expect(canPair(bench, dips)).toBe(false);
  });

  it("A, then B after the change, then the longer rest, then A again", () => {
    const a = ex("curl", ["biceps"], 1, { partner: "push", restS: 60 });
    const b = ex("push", ["triceps"], 1, { partner: "curl", restS: 75 });
    expect(afterSet([a, b], 0, false, times)).toEqual({
      next: 1,
      seconds: SUPERSET_SWITCH_S,
      words: "superserie · subito push",
    });
    expect(afterSet([a, b], 1, false, times)).toEqual({
      next: 0,
      seconds: 75,
      words: "superserie · poi curl",
    });
  });

  it("when the partner is done, as before: the next exercise after the transition", () => {
    const a = ex("curl", ["biceps"], 3, { partner: "push" });
    const b = ex("push", ["triceps"], 2, { partner: "curl" });
    const c = ex("crunch", ["abs"], 0);
    expect(afterSet([a, b, c], 1, false, times)).toEqual({
      next: 2,
      seconds: 120,
      words: "cambio esercizio · tua media",
    });
  });

  it("a warm-up stays on the exercise, a superset or not", () => {
    const a = ex("curl", ["biceps"], 0, { partner: "push" });
    const b = ex("push", ["triceps"], 0, { partner: "curl" });
    expect(afterSet([a, b], 0, true, times).next).toBe(0);
  });
});
