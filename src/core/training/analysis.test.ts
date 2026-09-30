/** Tests for core/training/analysis.ts, anchored on the developer's real numbers. */
import { describe, expect, it } from "vitest";
import {
  bestE1rm,
  burnRange,
  cardioMet,
  change,
  e1rm,
  records,
  tonnage,
} from "./analysis";

const s = (reps: number, load: number | null, warmup = false) => ({
  reps,
  loadKg: load === null ? null : String(load),
  warmup,
});

describe("tonnage", () => {
  it("matches the hand-made PUSH 1 figure (2026-09-11): 4 722 kg", () => {
    const push1 = [
      [s(12, 45), s(8, 50), s(10, 45)], // machine chest press
      [s(10, 35), s(8, 35), s(10, 30)], // peck back
      [s(10, 14), s(10, 14), s(8, 14)], // incline db press, "da 14" as written
      [s(9, 25), s(8, 25), s(7, 20)], // shoulder press
      [s(8, 10), s(9, 5), s(8, 5)], // cable lateral raise (unilateral, not doubled)
      [s(10, 25), s(10, 25), s(8, 25)], // overhead cable triceps extension
      [s(6, 30), s(8, 25), s(10, 20)], // cable triceps pushdown
    ];
    expect(push1.reduce((sum, sets) => sum + tonnage(sets), 0)).toBe(4722);
  });

  it("leaves out warm-ups and sets without a load", () => {
    expect(tonnage([s(5, 30, true), s(10, 60), s(10, null)])).toBe(600);
  });
});

describe("e1RM and comparisons", () => {
  it("uses Epley for 1–12 reps only", () => {
    expect(e1rm(10, "60")).toBe(80);
    expect(e1rm(15, "60")).toBeNull();
    expect(e1rm(8, null)).toBeNull();
    expect(bestE1rm([s(10, 60), s(6, 55), s(3, 70, true)])).toBe(80);
  });

  it("gives whole-percent changes", () => {
    expect(change(5480, 4722)).toBe(-14); // PUSH pre → PUSH 1, as in the diet plan
    expect(change(null, 10)).toBeNull();
  });

  it("keeps the heaviest load and best e1RM per exercise, with the day", () => {
    const r = records([
      {
        day: "2026-09-11",
        exercises: [{ exerciseId: "chest", sets: [s(12, 45), s(8, 50)] }],
      },
      {
        day: "2026-09-23",
        exercises: [{ exerciseId: "chest", sets: [s(10, 60), s(6, 55)] }],
      },
    ]);
    expect(r.get("chest")).toEqual({
      maxLoad: { kg: 60, day: "2026-09-23" },
      bestE1rm: { kg: 80, day: "2026-09-23" },
    });
  });
});

describe("burn range", () => {
  it("computes treadmill MET from speed and incline (ACSM walking)", () => {
    // FitForge's treadmill: 5 km/h (83.3 m/min), 12 % incline →
    // VO2 = 0.1·83.3 + 1.8·83.3·0.12 + 3.5 = 29.8 ml/kg/min → 8.5 MET.
    // FitForge said 227 kcal for 20 min at 76 kg ≈ 9 MET: consistent.
    expect(cardioMet(5, 12)).toBeCloseTo(8.52, 2);
  });

  it("gives a range, never a single number, and nothing without a weight", () => {
    const session = {
      durationMin: 60,
      exercises: [
        { kind: "strength" as const, sets: [s(10, 40)] },
        {
          kind: "cardio" as const,
          sets: [
            {
              reps: null,
              loadKg: null,
              warmup: false,
              durationS: 1200,
              speedKmh: "5",
              inclinePct: "12",
            },
          ],
        },
      ],
    };
    const r = burnRange(session, "76");
    // 40 min strength at 3.5–6 MET + 20 min treadmill at 8.52 MET ±15 %.
    const met = cardioMet(5, 12);
    expect(r).toEqual({
      low: Math.round(3.5 * 76 * (40 / 60) + met * 0.85 * 76 * (20 / 60)),
      high: Math.round(6 * 76 * (40 / 60) + met * 1.15 * 76 * (20 / 60)),
    });
    expect(burnRange(session, null)).toBeNull();
  });
});
