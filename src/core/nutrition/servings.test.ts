/** Tests for core/nutrition/servings.ts. */
import { describe, expect, it } from "vitest";
import { servingsText, stepServings } from "./servings";

describe("stepServings", () => {
  it("quarters below 1, halves to 4, then whole servings; null past the ends", () => {
    expect(stepServings(1, 1)).toBe(1.25);
    expect(stepServings(1, -1)).toBe(0.75);
    expect(stepServings(2, 1)).toBe(2.5);
    expect(stepServings(4, 1)).toBe(5);
    expect(stepServings(0.25, -1)).toBeNull();
    expect(stepServings(10, 1)).toBeNull();
    // A value between steps goes to the nearest step that way.
    expect(stepServings(1.1, 1)).toBe(1.25);
    expect(stepServings(1.1, -1)).toBe(1);
  });
});

describe("servingsText", () => {
  it("shows only the decimals the value has", () => {
    expect(servingsText(1, "it")).toBe("1");
    expect(servingsText(1.5, "it")).toBe("1,5");
    expect(servingsText(0.25, "en")).toBe("0.25");
  });
});
