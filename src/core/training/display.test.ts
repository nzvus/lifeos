/** Tests for core/training/display.ts. */
import { describe, expect, it } from "vitest";
import { setsText, setText } from "./display";

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
