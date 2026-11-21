import { describe, expect, it } from "vitest";
import { fitScale } from "./fit";

describe("fitScale (VIS-108: a one-line row shrinks to fit, down to a floor)", () => {
  it("fits: drawn at its size", () => {
    expect(fitScale(300, 280)).toEqual({ scale: 1, wrap: false });
  });
  it("a little too wide: smaller as a whole, exactly as much as needed", () => {
    expect(fitScale(270, 300)).toEqual({ scale: 0.9, wrap: false });
  });
  it("far too wide: the floor, and it wraps", () => {
    expect(fitScale(200, 300)).toEqual({ scale: 0.8, wrap: true });
  });
  it("no room measured yet: untouched", () => {
    expect(fitScale(0, 300)).toEqual({ scale: 1, wrap: false });
  });
});
