import { describe, expect, it } from "vitest";
import { bestE1rm } from "./log";

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
