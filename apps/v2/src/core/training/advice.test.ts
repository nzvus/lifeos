import { describe, expect, it } from "vitest";
import { DEFAULT_TIMING, type Timing } from "../engines/training";
import { adviseExercise } from "./advice";
import { hardSetsBefore, type HistorySession, type HistorySet } from "./history";

const timing: Timing = {
  ...DEFAULT_TIMING,
  secPerRep: 4.2,
  restS: 78,
  warmupRestS: 57,
  transitionS: 86,
  learnt: { secPerRep: true, restS: true, warmupRestS: true, transitionS: true },
};
const t0 = Date.parse("2026-10-01T07:00:00Z");
/** Working sets of `reps` at `kg`, 4 s a rep, `rest` s apart. */
const sets = (kg: string, reps: number[], rest = 80): HistorySet[] => {
  let at = t0;
  return reps.map((r) => {
    const start = at;
    at = start + r * 4000 + rest * 1000;
    return {
      reps: r,
      loadKg: kg,
      rir: null,
      warmup: false,
      side: null,
      durationS: null,
      startedAt: start,
      endedAt: start + r * 4000,
    };
  });
};
const session = (day: string, s: HistorySet[], before = 0): HistorySession => ({
  day,
  sessionId: day,
  before,
  sets: s,
});

describe("the hard sets before an exercise", () => {
  it("counts the working sets of earlier exercises that share a muscle", () => {
    const rows = [
      { id: "a", parentId: "s", itemId: "bench", day: "2026-10-01", position: 0 },
      { id: "b", parentId: "s", itemId: "fly", day: "2026-10-01", position: 1 },
      { id: "c", parentId: "s", itemId: "curl", day: "2026-10-01", position: 2 },
      { id: "d", parentId: "s", itemId: "dips", day: "2026-10-01", position: 3 },
    ];
    const work = new Map([
      ["a", 4],
      ["b", 3],
      ["c", 3],
      ["d", 3],
    ]);
    const muscles = new Map([
      ["bench", ["chest", "triceps"]],
      ["fly", ["chest"]],
      ["curl", ["biceps"]],
      ["dips", ["triceps", "chest"]],
    ]);
    expect([...hardSetsBefore(rows, work, muscles)]).toEqual([
      ["a", 0],
      ["b", 4],
      ["c", 0],
      ["d", 7],
    ]);
  });
});

describe("what gym mode proposes for an exercise", () => {
  const history = [
    session("2026-09-24", sets("60", [10, 9, 8])),
    session("2026-09-28", sets("60", [10, 9, 8])),
    session("2026-10-01", sets("60", [10, 10, 9])),
  ];

  it("the first set from the double progression, the next ones less the learnt drop", () => {
    const a = adviseExercise({
      pattern: "horizontal_press",
      unilateral: false,
      history,
      timing,
    });
    // Last time 10/10/9 at 60 kg in a 6–10 range: not all at the top → add reps from the weakest (9 → 10).
    expect(a.proposed.map((s) => [s.reps, s.loadKg])).toEqual([
      [10, "60"],
      [9, "60"],
      [8, "60"],
    ]);
  });

  it("rests from its own measured rests (80 s), within the floor, with their source", () => {
    const a = adviseExercise({
      pattern: "horizontal_press",
      unilateral: false,
      history,
      timing,
    });
    expect(a.restSource).toBe("learnt");
    // Drops 1, 2, 2 (newest first): two of the last three ≥ 2 → +30 s.
    expect(a.restS).toBe(110);
    expect(a.restChange).toBe(30);
    // 40 s for 10 reps: 4 s a rep, its own.
    expect(a.secPerRep).toBe(4);
    expect(a.setS).toBe(40);
  });

  it("a session cut short does not lower the next: as many sets as the more of the last two", () => {
    const cut = [...history.slice(0, 2), session("2026-10-01", sets("60", [10]))];
    const a = adviseExercise({
      pattern: "horizontal_press",
      unilateral: false,
      history: cut,
      timing,
    });
    expect(a.proposed).toHaveLength(3);
  });

  it("a rest set on the exercise wins; unilateral: after the pair, less the other side", () => {
    const a = adviseExercise({
      pattern: "curl",
      unilateral: true,
      history,
      timing,
      settings: { restS: 75, setupS: 3 },
    });
    expect(a.restS).toBe(75);
    expect(a.restSource).toBe("set");
    expect(a.afterPairS).toBe(75 - (a.setS ?? 0));
  });

  it("no history: the guide's start, the role's default rest, the person's seconds per rep", () => {
    const a = adviseExercise({
      pattern: "lateral_raise",
      unilateral: false,
      history: [],
      timing,
    });
    expect(a.restSource).toBe("default");
    expect(a.restS).toBe(60);
    expect(a.secPerRep).toBe(4.2);
    expect(a.trend.state).toBe("few");
  });
});

describe("dumbbells go by the rack's pairs", () => {
  it("10 · 10 · 10 at 2 × 15 kg in a 6–10 range → 2 × 17 kg, not 2 × 16.25", () => {
    const top = [session("2026-10-15", sets("30", [10, 10, 10]))];
    const a = adviseExercise({
      pattern: "horizontal_press",
      unilateral: false,
      dumbbells: true,
      history: top,
      timing,
    });
    expect(a.proposed[0]).toMatchObject({ reps: 6, loadKg: "34" });
    const plate = adviseExercise({
      pattern: "horizontal_press",
      unilateral: false,
      history: top,
      timing,
    });
    expect(plate.proposed[0]).toMatchObject({ loadKg: "32.5" });
  });
});
