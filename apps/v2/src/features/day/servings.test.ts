import { describe, expect, it } from "vitest";
import { stepServings } from "./servings";

describe("the day's −/+ on servings (v1 S-T10)", () => {
  it("quarters below 1, halves up to 4, whole numbers after", () => {
    expect(stepServings("1", 1)).toBe("1.5");
    expect(stepServings("1", -1)).toBe("0.75");
    expect(stepServings("0.5", 1)).toBe("0.75");
    expect(stepServings("3.5", 1)).toBe("4");
    expect(stepServings("4", 1)).toBe("5");
    expect(stepServings("4", -1)).toBe("3.5");
    expect(stepServings("5", -1)).toBe("4");
  });

  it("stays between ¼ and 20, and reads a missing value as 1", () => {
    expect(stepServings("0.25", -1)).toBe("0.25");
    expect(stepServings("20", 1)).toBe("20");
    expect(stepServings("", 1)).toBe("1.5");
  });
});
