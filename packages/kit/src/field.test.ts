import { describe, expect, it } from "vitest";
import { stepBy } from "./Field";

describe("the stepper", () => {
  it("steps with the decimal comma, never below zero, without float noise", () => {
    expect(stepBy("75,6", 0.1)).toBe("75,7");
    expect(stepBy("0,2", 0.1)).toBe("0,3");
    expect(stepBy("", 250)).toBe("250");
    expect(stepBy("100", -250)).toBe("0");
  });

  it("leaves what is not a number as it is", () => {
    expect(stepBy("abc", 1)).toBe("abc");
  });
});
