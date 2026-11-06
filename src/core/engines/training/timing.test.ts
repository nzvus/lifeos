import { describe, expect, it } from "vitest";
import { DEFAULT_TIMING, learnTiming, sessionSeconds, type TimedSet } from "./duration";
import { expectedReps, learntDrop, repsAt, rirTarget, vsExpected } from "./expected";
import { adaptRest, expectedSetS, learntRest, unilateralRests } from "./rests";

describe("what a set should give", () => {
  it("inverts Epley with the RIR aimed at; size first: compounds 2, isolation 1", () => {
    expect(rirTarget("compound")).toBe(2);
    expect(rirTarget("isolation")).toBe(1);
    // e1RM 80, 60 kg: 30 × (80/60 − 1) = 10 to failure, 8 at RIR 2.
    expect(repsAt(80, 60, 2)).toBe(8);
    expect(repsAt(80, 90, 0)).toBe(0);
  });

  it("learns the drop per set at one load: the median over sessions, never negative", () => {
    const s = (...reps: number[]) => reps.map((r) => ({ reps: r, kg: 40 }));
    expect(learntDrop([s(10, 10, 10), s(10, 9, 8), s(12, 11, 10)])).toBe(1);
    expect(learntDrop([s(10, 10, 10)])).toBe(0);
    expect(learntDrop([[{ reps: 10, kg: 40 }]])).toBe(0);
    expect(learntDrop([s(8, 9, 10)])).toBe(0);
  });

  it("expects fewer reps on later sets by the drop, and judges ±1 as expected", () => {
    const e = (index: number) =>
      expectedReps({ e1rm: 80, kg: 60, rir: 2, drop: 1, index });
    expect([0, 1, 2].map(e)).toEqual([8, 7, 6]);
    expect(vsExpected(9, 8)).toEqual({ diff: 1, word: "as" });
    expect(vsExpected(11, 8)).toEqual({ diff: 3, word: "above" });
    expect(vsExpected(5, 8)).toEqual({ diff: -3, word: "below" });
  });
});

describe("rests from the person's habit", () => {
  it("a compound with a median of 78 s: 78 s, «tua media» (dossier test 5)", () => {
    expect(
      learntRest({ role: "compound", reps: 8, measured: [70, 78, 81, 64, 80, 90] }),
    ).toEqual({ seconds: 79, source: "learnt" });
  });

  it("clamped to the floors; with fewer than 5 measured, the role's default", () => {
    expect(
      learntRest({ role: "isolation", reps: 12, measured: [40, 45, 42, 41, 44] }),
    ).toEqual({ seconds: 60, source: "learnt" });
    expect(learntRest({ role: "compound", reps: 8, measured: [70] })).toEqual({
      seconds: 90,
      source: "default",
    });
    expect(
      learntRest({
        role: "compound",
        reps: 8,
        measured: [20, 25, 22, 21, 24],
        warmup: true,
      }),
    ).toEqual({ seconds: 30, source: "learnt" });
  });

  it("+30 s when reps fall ≥ 2 in 2 of the last 3 sessions; −15 s when they never fall at RIR ≥ 2", () => {
    expect(
      adaptRest({ role: "compound", seconds: 80, drops: [2, 0, 3], lastRir: 1 }),
    ).toEqual({
      seconds: 110,
      change: 30,
    });
    expect(
      adaptRest({ role: "isolation", seconds: 110, drops: [2, 2], lastRir: 0 }),
    ).toEqual({
      seconds: 120,
      change: 10,
    });
    expect(
      adaptRest({ role: "compound", seconds: 80, drops: [0, 0, 0], lastRir: 2 }),
    ).toEqual({
      seconds: 65,
      change: -15,
    });
    expect(
      adaptRest({ role: "compound", seconds: 65, drops: [0, 0, 0], lastRir: 3 }),
    ).toEqual({
      seconds: 60,
      change: -5,
    });
    expect(
      adaptRest({ role: "compound", seconds: 80, drops: [1, 0], lastRir: null }),
    ).toEqual({
      seconds: 80,
      change: 0,
    });
  });

  it("unilateral: the other side's 35 s count as rest (dossier test 6)", () => {
    expect(unilateralRests({ setRestS: 80, otherSideS: 35 })).toEqual({
      betweenSidesS: 5,
      afterPairS: 45,
    });
    expect(unilateralRests({ setRestS: 60, otherSideS: 50, setupS: 20 })).toEqual({
      betweenSidesS: 10,
      afterPairS: 30,
    });
  });
});

describe("timing", () => {
  it("auto mode: 10 reps at 4.2 s a rep is 42 s with no setup; manual waits its setup (test 7)", () => {
    const timed = [{ reps: 10, seconds: 42 }];
    expect(expectedSetS({ reps: 10, role: "compound", timed, setupS: 0 })).toEqual({
      seconds: 42,
      learnt: true,
    });
    expect(expectedSetS({ reps: 10, role: "compound", timed, setupS: 8 }).seconds).toBe(
      50,
    );
  });

  const t0 = Date.parse("2026-10-14T07:15:00Z");
  const set = (startS: number, durS: number, reps: number, warmup = false): TimedSet => ({
    reps,
    durationS: null,
    warmup,
    startedAt: t0 + startS * 1000,
    endedAt: t0 + (startS + durS) * 1000,
  });

  it("learns seconds per rep, rests, warm-up rests and transitions from timed sets", () => {
    // Two exercises: a warm-up, then sets of 10 reps in 40 s with 80 s rests; 90 s to change.
    const a = [set(0, 30, 10, true), set(85, 40, 10), set(205, 40, 10), set(325, 40, 10)];
    const b = [set(455, 40, 10), set(575, 40, 10), set(695, 40, 10), set(815, 40, 10)];
    const t = learnTiming([[a, b]]);
    expect(t.secPerRep).toBe(4);
    expect(t.restS).toBe(80);
    expect(t.learnt.warmupRestS).toBe(false); // one measured
    expect(t.warmupRestS).toBe(DEFAULT_TIMING.warmupRestS);
    expect(t.learnt.transitionS).toBe(false);
  });

  it("adds sets, rests, setups and the changes between exercises", () => {
    const t = {
      ...DEFAULT_TIMING,
      secPerRep: 4,
      restS: 80,
      warmupRestS: 60,
      transitionS: 90,
      learnt: { secPerRep: true, restS: true, warmupRestS: true, transitionS: true },
    };
    const s = (reps: number, warmup = false) => ({ reps, durationS: null, warmup });
    // A: warm-up 5 (20 s) + 60 + 3 × 10 (40 s) with 2 rests of 80 → 20+60+120+160 = 360
    // B: 2 × 12 (48 s) + 1 rest of 100 (its own) → 196; one change 90 → 646.
    expect(
      sessionSeconds(
        [
          { sets: [s(5, true), s(10), s(10), s(10)] },
          { sets: [s(12), s(12)], restS: 100 },
          { sets: [] },
        ],
        t,
      ),
    ).toBe(646);
  });
});
