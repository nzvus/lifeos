import { describe, expect, it } from "vitest";
import { score, SESSION } from "../judgements";
import { sessionParts, type ScoredExercise } from "./score";

const w = (reps: number, rir: number | null = null) => ({ reps, warmup: false, rir });
const p = (...reps: number[]) => reps.map((r) => ({ reps: r }));

describe("a session's parts for the session score", () => {
  const bench: ScoredExercise = {
    role: "compound",
    proposed: p(10, 9, 8),
    done: [{ reps: 8, warmup: true, rir: null }, w(10), w(9), w(8, 2)],
    restS: 80,
    rests: [78, 85, 140],
  };
  const curl: ScoredExercise = {
    role: "isolation",
    proposed: p(12, 11, 10),
    done: [w(9), w(8, 3)],
    restS: 60,
    rests: [],
  };

  it("progression, volume, effort and rests, each 0–1", () => {
    const parts = sessionParts([bench, curl]);
    // Bench as proposed; curl 3 reps short on average.
    expect(parts.progression).toBe(0.5);
    // 5 of 6 working sets: 83 %, 7 points under 90 % with a tolerance of 50 → 0.86.
    expect(parts.volume).toBeCloseTo(1 - (0.9 - 5 / 6) / 0.5, 5);
    // Bench RIR 2 in 1–3; curl RIR 3 outside 0–2.
    expect(parts.effort).toBe(0.5);
    // 78 and 85 within ±30 % of 80; 140 not.
    expect(parts.rests).toBeCloseTo(2 / 3, 5);
  });

  it("a set at another load is brought to the proposed one: 10 × 70 beats 8 × 62.5", () => {
    const leg: ScoredExercise = {
      role: "compound",
      proposed: [{ reps: 8, loadKg: "62.5" }],
      done: [{ reps: 6, loadKg: "70", warmup: false, rir: null }],
      restS: 90,
      rests: [],
    };
    // 6 × 70 is e1RM 84 → 10 reps at 62.5: above the proposal, not 2 short.
    expect(sessionParts([leg]).progression).toBe(1);
  });

  it("leaves out what was not said: no RIR, no timed rest", () => {
    const parts = sessionParts([{ ...curl, done: [w(12), w(11), w(10)] }]);
    expect(parts).toEqual({ progression: 1, volume: 1, effort: null, rests: null });
    const s = score(SESSION, parts);
    expect(s.missing).toEqual(["effort", "rests"]);
    expect(s.value).toBe(100);
  });
});
