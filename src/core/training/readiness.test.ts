/** Readiness and volume advice (ADR-0049). */
import { describe, expect, it } from "vitest";
import { volumeAdvice } from "./progress";
import { readiness } from "./readiness";

describe("readiness", () => {
  it("names what makes today a poor day; nothing said, nothing to say", () => {
    expect(readiness({ sleptHours: 5.5, energy: 2, stress: 4 })).toEqual([
      "short_night",
      "low_energy",
      "high_stress",
    ]);
    expect(readiness({ sleptHours: 7.5, energy: 3, stress: 3 })).toEqual([]);
    expect(readiness({ sleptHours: null, energy: null, stress: null })).toEqual([]);
  });
});

describe("volumeAdvice", () => {
  it("under 10 weighted sets: add; over 20: returns diminish", () => {
    const week = new Map([
      ["chest", 6],
      ["lats", 14],
      ["quads", 22.5],
    ] as const);
    expect(volumeAdvice(week)).toEqual({ low: ["chest"], high: ["quads"] });
  });
});
