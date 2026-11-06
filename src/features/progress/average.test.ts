import { describe, expect, it } from "vitest";
import { averageScore } from "./average";

describe("a period's score from its days'", () => {
  it("each part's mean over the days that had it, weighted as the model", () => {
    const a = {
      value: 70,
      parts: [
        { name: "obiettivi del giorno", score: 0.8, weight: 0.45 },
        { name: "recupero", score: 0.6, weight: 0.35 },
        { name: "abitudini", score: 0.6, weight: 0.2 },
      ],
      missing: [],
    };
    const b = {
      value: 90,
      parts: [{ name: "obiettivi del giorno", score: 1, weight: 1 }],
      missing: ["recupero", "abitudini"],
    };
    const s = averageScore([a, b, undefined])!;
    expect(s.parts.map((p) => [p.name, p.score])).toEqual([
      ["obiettivi del giorno", 0.9],
      ["recupero", 0.6],
      ["abitudini", 0.6],
    ]);
    // 0.45 × 0.9 + 0.35 × 0.6 + 0.2 × 0.6 = 0.735
    expect(s.value).toBe(74);
    expect(s.missing).toEqual([]);
  });

  it("nothing without a scored day", () => {
    expect(averageScore([undefined, null])).toBeUndefined();
  });

  it("a part named with what decided it counts as its part", () => {
    const meal = (limits: string, score: number) => ({
      value: 50,
      parts: [
        { name: "densità", score: 0.5, weight: 0.6 },
        { name: limits, score, weight: 0.4 },
      ],
      missing: [],
    });
    const s = averageScore([meal("limiti · sale", 0.2), meal("limiti", 1)])!;
    expect(s.parts.map((p) => [p.name, p.score])).toEqual([
      ["densità", 0.5],
      ["limiti", 0.6],
    ]);
  });
});
