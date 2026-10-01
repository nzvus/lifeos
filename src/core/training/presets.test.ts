/** Tests for core/training/presets.ts: a routine always at its latest version. */
import { describe, expect, it } from "vitest";
import { labelFamily, latestPreset } from "./presets";

const set = (reps: number, loadKg: string, warmup = false) => ({ reps, loadKg, warmup });
const push = {
  id: "r1",
  name: "Push",
  items: [
    { exerciseId: "old", sets: 2, reps: 8, loadKg: "40", durationS: null, restS: 110 },
  ],
};
const fromItem = (it: { reps: number | null; loadKg: string | null }) => ({
  reps: it.reps,
  loadKg: it.loadKg,
  warmup: false,
});

describe("labelFamily", () => {
  it("splits a trailing number off", () => {
    expect(labelFamily("PUSH 5")).toEqual({ family: "push", n: 5 });
    expect(labelFamily("Legs")).toEqual({ family: "legs", n: null });
  });
});

describe("latestPreset", () => {
  it("uses the routine's items until a session of it exists", () => {
    const p = latestPreset(push, [], fromItem);
    expect(p.label).toBe("Push");
    expect(p.from).toEqual({ kind: "routine" });
    expect(p.exercises).toEqual([
      { exerciseId: "old", restS: 110, sets: [set(8, "40"), set(8, "40")] },
    ]);
  });

  it("repeats the last session of the family, named like the routine, warm-ups left out", () => {
    const session = (
      day: string,
      label: string,
      exerciseId: string,
      status = "done",
    ) => ({
      day,
      label,
      status,
      routineId: null,
      exercises: [{ exerciseId, restS: 80, sets: [set(5, "30", true), set(10, "60")] }],
    });
    const p = latestPreset(
      push,
      [
        session("2026-09-23", "PUSH 4", "a"),
        session("2026-09-30", "PUSH 5", "b"),
        session("2026-10-02", "PUSH 6", "c", "planned"), // a plan is not a version
        session("2026-10-01", "PULL 5", "d"),
      ],
      fromItem,
    );
    expect(p.label).toBe("Push");
    expect(p.from).toEqual({ kind: "session", day: "2026-09-30", label: "PUSH 5" });
    expect(p.exercises).toEqual([{ exerciseId: "b", restS: 80, sets: [set(10, "60")] }]);
  });
});
