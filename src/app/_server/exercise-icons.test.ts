/**
 * ui/ ↔ core consistency (ui/ may not import core, so it is checked here):
 * every movement pattern has a drawing, and every drawing a pattern.
 */
import { describe, expect, it } from "vitest";
import { MOVEMENT_PATTERNS } from "@/core/training/anatomy";
import { EXERCISE_ICON_SHAPES } from "@/ui/exerciseIconShapes";

describe("exercise icon shapes", () => {
  it("cover exactly the movement patterns", () => {
    expect(Object.keys(EXERCISE_ICON_SHAPES).sort()).toEqual(
      [...MOVEMENT_PATTERNS].sort(),
    );
  });

  it("stay on the 24×24 grid", () => {
    const numbers = Object.values(EXERCISE_ICON_SHAPES)
      .flat()
      .flatMap((s) => (typeof s === "string" ? [] : [s[0], s[1]]));
    expect(numbers.every((n) => n >= 0 && n <= 24)).toBe(true);
  });
});
