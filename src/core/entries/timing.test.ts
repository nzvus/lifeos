import { describe, expect, it } from "vitest";
import { pastState, plannedAt, stateAt, timingOf, TIMING_DEFAULTS } from "./timing";

// MOD-15 as amended (reframe §11; his 15 and 20 Nov): the time decides the state.
describe("the time decides the state (MOD-15)", () => {
  const now = new Date("2026-11-20T12:00:00Z");
  const at = (min: number) => new Date(now.getTime() + min * 60_000);

  it("after now + the slack is previsto, at now or before is fatto, whatever was tapped", () => {
    expect(stateAt("done", at(21), 20, now)).toBe("planned");
    expect(stateAt("planned", at(20), 20, now)).toBe("done");
    expect(stateAt("planned", at(-90), 20, now)).toBe("done");
    expect(stateAt("done", at(-5), 20, now)).toBe("done");
  });

  it("saltato is an act and stays; a voce with no time keeps what was asked", () => {
    expect(stateAt("skipped", at(-30), 20, now)).toBe("skipped");
    expect(stateAt("planned", null, 20, now)).toBe("planned");
  });

  it("a past previsto follows his setting once its day is over; today's stays previsto", () => {
    expect(pastState("planned", "2026-11-19", "2026-11-20", "skipped")).toBe("skipped");
    expect(pastState("planned", "2026-11-19", "2026-11-20", "confirmed")).toBe("done");
    expect(pastState("planned", "2026-11-19", "2026-11-20", "unconfirmed")).toBe(
      "planned",
    );
    expect(pastState("planned", "2026-11-20", "2026-11-20", "skipped")).toBe("planned");
    expect(pastState("done", "2026-11-19", "2026-11-20", "skipped")).toBe("done");
  });

  it("the settings default to 20 minutes and saltato; out-of-range values fall back", () => {
    expect(timingOf({})).toEqual(TIMING_DEFAULTS);
    expect(timingOf({ timing: { slackMin: 5, pastPlanned: "confirmed" } })).toEqual({
      slackMin: 5,
      pastPlanned: "confirmed",
    });
    expect(timingOf({ timing: { slackMin: 999, pastPlanned: "boh" } })).toEqual(
      TIMING_DEFAULTS,
    );
  });
});

describe("a form still open reads the state from the time too (MOD-15)", () => {
  const rome = { timeZone: "Europe/Rome", boundaryMin: 240 };
  const now = new Date("2026-11-20T11:00:00Z"); // 12:00 in Rome
  it("today: after now + the slack is previsto; before, and no time, are fatto", () => {
    expect(plannedAt("2026-11-20", "12:30", "2026-11-20", rome, 20, now)).toBe(true);
    expect(plannedAt("2026-11-20", "12:15", "2026-11-20", rome, 20, now)).toBe(false);
    expect(plannedAt("2026-11-20", "08:00", "2026-11-20", rome, 20, now)).toBe(false);
    expect(plannedAt("2026-11-20", "", "2026-11-20", rome, 20, now)).toBe(false);
  });
  it("01:30 closes the logical day, so at noon it is still to come; other days by their date", () => {
    expect(plannedAt("2026-11-20", "01:30", "2026-11-20", rome, 20, now)).toBe(true);
    expect(plannedAt("2026-11-21", "", "2026-11-20", rome, 20, now)).toBe(true);
    expect(plannedAt("2026-11-19", "23:00", "2026-11-20", rome, 20, now)).toBe(false);
  });
});
