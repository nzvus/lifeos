import { describe, expect, it } from "vitest";
import { dashes } from "./ConcentricRings";

describe("dashes", () => {
  it("draws dashes up to the excess, then hides the rest of the lap", () => {
    const parts = dashes(20, 100).split(" ").map(Number);
    expect(parts.length % 2).toBe(0); // dash, gap pairs: never a final dash
    expect(parts.at(-1)).toBe(100);
    const drawn = parts.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    expect(drawn).toBe(5 + 5 + 4); // 0–5, 8–13, 16–20
  });
});
