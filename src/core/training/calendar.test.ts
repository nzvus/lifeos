import { describe, expect, it } from "vitest";
import { isMonth, lookOf, monthGrid, shiftMonth } from "./calendar";

describe("monthGrid", () => {
  it("covers the month in whole weeks from Monday", () => {
    const weeks = monthGrid("2026-10"); // 1 Oct 2026 is a Thursday
    expect(weeks[0]![0]).toBe("2026-09-28");
    expect(weeks.at(-1)![6]).toBe("2026-11-01");
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });
  it("moves across years", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(isMonth("2026-13")).toBe(false);
  });
});

describe("lookOf", () => {
  it("takes the region with most working sets and the main exercise's movement", () => {
    expect(
      lookOf([
        {
          kind: "strength",
          pattern: "horizontal_press",
          muscleGroups: ["chest", "triceps"],
          sets: 4,
        },
        {
          kind: "strength",
          pattern: "lateral_raise",
          muscleGroups: ["side_delts"],
          sets: 3,
        },
      ]),
    ).toEqual({ region: "chest", pattern: "horizontal_press", cardio: false });
  });
  it("gives a cardio day no region", () => {
    expect(
      lookOf([{ kind: "cardio", pattern: "run", muscleGroups: [], sets: 1 }]),
    ).toEqual({
      region: null,
      pattern: "run",
      cardio: true,
    });
  });
});
