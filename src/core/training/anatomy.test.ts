import { describe, expect, it } from "vitest";
import {
  MUSCLE_GROUP_REGION,
  MUSCLE_GROUPS,
  MUSCLE_REGIONS,
  regionOf,
  setShares,
  suggestAnatomy,
} from "./anatomy";

describe("muscle groups", () => {
  it("every group belongs to a known region, and every region has groups", () => {
    const regions = new Set(Object.values(MUSCLE_GROUP_REGION));
    expect([...regions].sort()).toEqual([...MUSCLE_REGIONS].sort());
    expect(MUSCLE_GROUPS).toHaveLength(17);
  });

  it("the region is the primary group's; unknown or none -> null", () => {
    expect(regionOf(["triceps", "chest"])).toBe("arms");
    expect(regionOf([])).toBeNull();
    expect(regionOf(["dorsali"])).toBeNull();
  });

  it("a set counts 1 for the primary group and 0.5 for the others", () => {
    expect(setShares(["lats", "biceps", "nope"])).toEqual([
      ["lats", 1],
      ["biceps", 0.5],
    ]);
  });
});

describe("suggestAnatomy", () => {
  // The developer's 21 real exercises (PUSH/PULL logs + FitForge, 2026-10-01).
  it.each([
    ["Machine chest press", "horizontal_press", "chest"],
    ["Incline DB press", "horizontal_press", "chest"],
    ["Shoulder press", "vertical_press", "front_delts"],
    ["Peck back", "fly", "chest"],
    ["Cable lateral raise", "lateral_raise", "side_delts"],
    ["Overhead cable triceps extention", "triceps_extension", "triceps"],
    ["OCTE", "triceps_extension", "triceps"],
    ["Cable triceps pushdown", "triceps_extension", "triceps"],
    ["Lat pulldown", "vertical_pull", "lats"],
    ["Pulley row", "horizontal_pull", "upper_back"],
    ["Chest supported row", "horizontal_pull", "upper_back"],
    ["Chest supp row", "horizontal_pull", "upper_back"],
    ["Reverse peck deck", "rear_fly", "rear_delts"],
    ["Preacher curl", "curl", "biceps"],
    ["Cable biceps curl", "curl", "biceps"],
    ["Seated Leg Curl", "leg_curl", "hamstrings"],
    ["Incline Leg Press", "leg_press", "quads"],
    ["Smith Machine Squat", "squat", "quads"],
    ["Goblet Squat", "squat", "quads"],
    ["Bulgarian Split Squat", "lunge", "quads"],
    ["Hanging folded legs raises", "leg_raise", "abs"],
    ["Upper abdominal machine", "crunch", "abs"],
  ])("%s -> %s, primary %s", (name, pattern, primary) => {
    const s = suggestAnatomy(name);
    expect(s.pattern).toBe(pattern);
    expect(s.muscleGroups[0]).toBe(primary);
  });

  it("cardio has a pattern and no muscle groups", () => {
    expect(suggestAnatomy("Treadmill")).toEqual({ pattern: "run", muscleGroups: [] });
  });

  it("an unknown name suggests nothing", () => {
    expect(suggestAnatomy("Farmer's walk")).toEqual({ pattern: null, muscleGroups: [] });
  });

  it("returns a copy: changing it does not change the rules", () => {
    suggestAnatomy("Lat pulldown").muscleGroups.push("calves");
    expect(suggestAnatomy("Lat pulldown").muscleGroups).not.toContain("calves");
  });
});
