import { describe, expect, it } from "vitest";
import { proposeSets } from "./plan";

const set = (reps: number, loadKg: string | null, rir?: number) => ({
  reps,
  loadKg,
  durationS: null,
  warmup: false,
  rir: rir ?? null,
});

describe("the sets gym mode proposes", () => {
  it("adds reps until the top of the range, then load (double progression)", () => {
    expect(proposeSets("horizontal_press", [set(8, "60"), set(7, "60")])).toEqual({
      reason: "add_reps",
      sets: [
        { reps: 8, loadKg: "60", durationS: null },
        { reps: 8, loadKg: "60", durationS: null },
      ],
    });
    expect(
      proposeSets("horizontal_press", [set(10, "60"), set(10, "60")]).sets[0],
    ).toEqual({
      reps: 6,
      loadKg: "62.5",
      durationS: null,
    });
  });

  it("starts at the guide's range with no history, keeps the last sets with no pattern", () => {
    expect(proposeSets("curl", [])).toMatchObject({
      reason: "start",
      sets: [{ reps: 8 }, { reps: 8 }],
    });
    expect(proposeSets("other", [set(12, "15"), set(10, "15")]).sets).toEqual([
      { reps: 12, loadKg: "15", durationS: null },
      { reps: 10, loadKg: "15", durationS: null },
    ]);
    expect(proposeSets(null, undefined).sets).toHaveLength(3);
  });

  it("times a plank and a run", () => {
    expect(
      proposeSets("plank", [{ reps: null, loadKg: null, durationS: 40, warmup: false }])
        .sets[0],
    ).toEqual({ reps: null, loadKg: null, durationS: 44 });
    expect(proposeSets("run", []).sets).toEqual([
      { reps: null, loadKg: null, durationS: 1200 },
    ]);
  });
});
