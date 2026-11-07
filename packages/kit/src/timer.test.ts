import { describe, expect, it } from "vitest";
import { timerClock } from "./timer";

describe("Timer (PAT-63)", () => {
  it("a countdown shows what is left and its length, then how far past it is", () => {
    const rest = { kind: "countdown" as const, from: 0, seconds: 90 };
    expect(timerClock(rest, 30, null)).toEqual({
      shown: 60,
      over: null,
      of: 90,
      share: 1 / 3,
    });
    expect(timerClock(rest, 100, null)).toEqual({
      shown: 10,
      over: 10,
      of: null,
      share: 1,
    });
  });
  it("a running phase shows how long it has run, against what it was expected to take", () => {
    expect(timerClock({ kind: "running", from: 0, seconds: 40 }, 30, null)).toMatchObject(
      {
        shown: 30,
        share: 0.75,
      },
    );
    expect(
      timerClock({ kind: "running", from: 0, seconds: null }, 30, null).share,
    ).toBeNull();
  });
  it("at rest it is the caller's own clock, or none", () => {
    expect(timerClock({ kind: "idle" }, 5, 600).shown).toBe(600);
    expect(timerClock({ kind: "idle" }, 5, null).shown).toBeNull();
  });
});
