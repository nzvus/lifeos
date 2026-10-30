import { describe, expect, it } from "vitest";
import { nextLevel, readLevel } from "./levels";

describe("levels of expansion (UI-80)", () => {
  it("goes one level further, then back to the smallest", () => {
    expect(nextLevel(0, 2)).toBe(1);
    expect(nextLevel(1, 2)).toBe(2);
    expect(nextLevel(2, 2)).toBe(0);
  });

  it("reads back only a level that exists, else the fallback", () => {
    expect(readLevel("2", 2, 1)).toBe(2);
    expect(readLevel("0", 2, 1)).toBe(0);
    expect(readLevel(null, 2, 1)).toBe(1);
    expect(readLevel("", 2, 1)).toBe(1);
    expect(readLevel("3", 2, 1)).toBe(1);
    expect(readLevel("1.5", 2, 1)).toBe(1);
    expect(readLevel("aperto", 2, 1)).toBe(1);
  });
});
