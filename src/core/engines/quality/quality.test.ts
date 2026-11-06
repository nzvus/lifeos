import { describe, expect, it } from "vitest";
import { PER_SIDE_FACTORS, quality } from "./quality";

describe("E9: data quality", () => {
  const w = { from: "2026-10-10", to: "2026-10-16" };
  it("missing days where the kind expects a value", () => {
    const entries = ["2026-10-10", "2026-10-11", "2026-10-13"].map((day, i) => ({
      id: `w${i}`,
      day,
      value: 76,
    }));
    const r = quality({ entries, window: w, expected: () => true });
    expect(r.issues[0]).toEqual({
      type: "missing",
      days: ["2026-10-12", "2026-10-14", "2026-10-15", "2026-10-16"],
    });
  });
  it("values out of the field's range, and duplicates", () => {
    const entries = [
      { id: "a", day: "2026-10-10", minute: 480, value: 7.5 },
      { id: "b", day: "2026-10-10", minute: 480, value: 7.5 },
      { id: "c", day: "2026-10-11", value: 26 },
    ];
    expect(quality({ entries, window: w, range: { min: 0, max: 16 } }).issues).toEqual([
      { type: "outOfRange", id: "c", value: 26, min: 0, max: 16 },
      { type: "duplicate", id: "b", of: "a" },
    ]);
  });
  it("2026-10-15: dumbbell loads typed per dumbbell are a ×½ jump on a per-side field", () => {
    const loads = [
      { id: "s1", day: "2026-10-11", value: 45 },
      { id: "s2", day: "2026-10-13", value: 45 },
      { id: "s3", day: "2026-10-15", value: 22.5 },
    ];
    expect(
      quality({ entries: loads, window: w, factors: PER_SIDE_FACTORS }).issues,
    ).toEqual([{ type: "unitJump", id: "s3", factor: 0.5, previous: 45, value: 22.5 }]);
    // Steps doubling is a real day: not a slip by default.
    const steps = [
      { id: "p1", day: "2026-10-11", value: 5000 },
      { id: "p2", day: "2026-10-12", value: 10200 },
    ];
    expect(quality({ entries: steps, window: w }).issues).toEqual([]);
  });
  it("a g-for-kg slip, and the estimated share", () => {
    const entries = [
      { id: "a", day: "2026-10-10", value: 76.2 },
      { id: "b", day: "2026-10-11", value: 76200, estimated: true },
    ];
    const r = quality({ entries, window: w });
    expect(r.issues).toEqual([
      { type: "unitJump", id: "b", factor: 1000, previous: 76.2, value: 76200 },
    ]);
    expect(r.estimatedShare).toBe(0.5);
    expect(quality({ entries: [], window: w }).estimatedShare).toBeNull();
  });
});
