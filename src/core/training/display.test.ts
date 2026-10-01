/** Tests for core/training/display.ts. */
import { describe, expect, it } from "vitest";
import { sessionSummary, setsText, setText } from "./display";

const s = (reps: number | null, loadKg: string | null, v = {}) => ({
  reps,
  loadKg,
  ...v,
});

describe("training display", () => {
  it("writes sets the way the notes do", () => {
    expect(setsText([s(10, "40"), s(10, "40"), s(10, "40"), s(8, "35")], "it")).toBe(
      "3×10×40 · 8×35",
    );
    expect(setsText([s(10, null), s(10, null), s(10, null)], "it")).toBe("3×10");
    expect(setsText([s(5, "30", { warmup: true }), s(7, "17.5")], "it")).toBe("7×17,5");
    expect(setText(s(7, "20", { loadApprox: true }), "it")).toBe("7×20~");
    expect(
      setText(
        s(null, null, { durationS: 1200, speedKmh: "5.0", inclinePct: "12.0" }),
        "it",
      ),
    ).toBe("20 min 5,0 km/h 12%");
    expect(setText(s(null, null, { durationS: 1800, distanceM: 5000 }), "it")).toBe(
      "30 min 5,0 km",
    );
  });
});

describe("sessionSummary", () => {
  const set = (v: Record<string, unknown>) => ({
    reps: null,
    loadKg: null,
    warmup: false,
    ...v,
  });
  it("cardio by time, distance and pace; strength by sets and tonnage", () => {
    const s = sessionSummary({
      durationMin: 60,
      exercises: [
        {
          kind: "cardio",
          sets: [set({ durationS: 3600, distanceM: 8380, speedKmh: "7.0" })],
        },
        {
          kind: "strength",
          sets: [
            set({ reps: 10, loadKg: "40" }),
            set({ reps: 8, loadKg: "40", warmup: true }),
          ],
        },
      ],
    });
    expect(s.cardio).toEqual({ minutes: 60, km: 8.38, kmh: expect.closeTo(8.38, 5) });
    expect(s.strength).toEqual({ exercises: 1, sets: 1, tonnage: 400 });
    // Treadmill with only a speed: distance from speed × time.
    const t = sessionSummary({
      durationMin: null,
      exercises: [{ kind: "cardio", sets: [set({ durationS: 1800, speedKmh: "6" })] }],
    });
    expect(t.cardio).toEqual({ minutes: 30, km: 3, kmh: 6 });
    expect(sessionSummary({ durationMin: 55, exercises: [] })).toEqual({
      cardio: null,
      strength: null,
      minutes: 55,
    });
  });
});
