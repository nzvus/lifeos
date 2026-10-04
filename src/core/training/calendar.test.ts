import { describe, expect, it } from "vitest";
import { isMonth, lookOf, monthGrid, planPanels, shiftMonth } from "./calendar";

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

describe("planPanels", () => {
  it("weeks: 4 before and 8 after the week of the day, Monday first", () => {
    const { panels, at } = planPanels("week", "2026-10-04"); // a Sunday
    expect(panels).toHaveLength(13);
    expect(panels[at]!.weeks).toEqual([
      [
        "2026-09-28",
        "2026-09-29",
        "2026-09-30",
        "2026-10-01",
        "2026-10-02",
        "2026-10-03",
        "2026-10-04",
      ],
    ]);
    expect(panels[0]!.key).toBe("2026-08-31");
    expect(panels.at(-1)!.key).toBe("2026-11-23");
  });

  it("months: 2 before and 3 after, across the year", () => {
    const { panels, at } = planPanels("month", "2026-11-15");
    expect(panels.map((p) => p.key)).toEqual([
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
    expect(panels[at]!.weeks).toEqual(monthGrid("2026-11"));
  });
});
