import { describe, expect, it } from "vitest";
import { kgStep, lastTimeText, restFor, setText, timed } from "./present";

const nb = (s: string) => s.replace(/ /g, " ");
const set = (
  reps: number | null,
  loadKg: string | null,
  durationS: number | null = null,
) => ({
  reps,
  loadKg,
  durationS,
  warmup: false,
});

describe("gym mode's words", () => {
  it("writes a set as lifted", () => {
    expect(nb(setText({ ...set(8, "60.00"), rir: 2 }, true))).toBe("8 × 60 kg · RIR 2");
    expect(setText(set(12, null))).toBe("12");
    expect(nb(setText(set(null, null, 45)))).toBe("45 s");
    expect(nb(setText(set(null, null, 1800)))).toBe("30 min");
  });

  it("says the last time in one line", () => {
    expect(
      nb(lastTimeText("2026-10-12", [set(8, "60.00"), set(8, "60.00"), set(7, "60.00")])),
    ).toBe("L’ultima volta, 12 ott: 8 · 8 · 7 × 60 kg");
    expect(nb(lastTimeText("2026-10-12", [set(10, "20"), set(8, "22.5")]))).toBe(
      "L’ultima volta, 12 ott: 10 × 20 kg, 8 × 22,5 kg",
    );
    expect(lastTimeText("2026-10-12", [])).toBe("");
  });

  it("rests by the pattern's role, steps by the load, times a plank", () => {
    expect(restFor("squat", 5)).toEqual({ low: 120, high: 180 });
    expect(restFor("curl", 10)).toEqual({ low: 60, high: 90 });
    expect(restFor(null, 10)).toEqual({ low: 90, high: 120 });
    expect([kgStep("60"), kgStep("12,5"), kgStep("")]).toEqual([2.5, 1, 1]);
    expect([timed("plank"), timed("curl"), timed(null)]).toEqual([true, false, false]);
  });
});
