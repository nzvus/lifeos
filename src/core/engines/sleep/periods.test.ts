import { describe, expect, it } from "vitest";
import { sleepOn, sleepPeriods } from "./periods";

// The developer's nights (dossiers/sleep.md §8), Europe/Rome in October = UTC+2.
const t = (day: number, hm: string) => new Date(`2026-10-${day}T${hm}:00+02:00`);
const piece = (d1: number, a: string, d2: number, b: string) => ({
  start: t(d1, a),
  end: t(d2, b),
});
const ROME = "Europe/Rome";

describe("sleep periods", () => {
  it("1: a whole night is one period with no time awake", () => {
    const [p] = sleepPeriods([piece(27, "23:30", 28, "07:02")]);
    expect(p).toMatchObject({ asleepMin: 452, awakeMin: 0, awakenings: 0, pieces: 1 });
  });

  it("2: a broken night is one period: its hours, the time awake, one awakening", () => {
    const d = sleepOn(
      [piece(26, "23:30", 27, "03:00"), piece(27, "03:50", 27, "07:02")],
      "2026-10-27",
      ROME,
    );
    expect(d.night).toMatchObject({ asleepMin: 402, awakeMin: 50, awakenings: 1 });
    expect(d.night!.bed).toEqual(t(26, "23:30"));
    expect(d.night!.wake).toEqual(t(27, "07:02"));
    expect(d.naps).toEqual([]);
    expect(d.totalMin).toBe(402);
  });

  it("3: falling asleep again within 2 h joins the night, even when saved as a nap", () => {
    const d = sleepOn(
      [piece(20, "00:12", 20, "05:17"), piece(20, "06:20", 20, "08:40")],
      "2026-10-20",
      ROME,
    );
    expect(d.night).toMatchObject({ asleepMin: 305 + 140, awakeMin: 63, pieces: 2 });
    expect(d.naps).toEqual([]);
  });

  it("4: after more than 2 h awake it is a nap, counted in the day's sleep", () => {
    const d = sleepOn(
      [piece(20, "00:12", 20, "05:17"), piece(20, "08:30", 20, "10:00")],
      "2026-10-20",
      ROME,
    );
    expect(d.night!.asleepMin).toBe(305);
    expect(d.naps.map((n) => n.asleepMin)).toEqual([90]);
    expect(d.totalMin).toBe(395);
  });

  it("5: an afternoon nap adds to the day, the night stays the night", () => {
    const d = sleepOn(
      [piece(29, "00:37", 29, "07:12"), piece(29, "14:00", 29, "14:20")],
      "2026-10-29",
      ROME,
    );
    expect(d.night!.asleepMin).toBe(395);
    expect(d.naps.map((n) => n.asleepMin)).toEqual([20]);
    expect(d.totalMin).toBe(415);
  });

  it("6: a double entry is counted once", () => {
    const d = sleepOn(
      [piece(22, "23:00", 23, "07:00"), piece(22, "23:00", 23, "07:00")],
      "2026-10-23",
      ROME,
    );
    expect(d.totalMin).toBe(480);
    expect(d.night!.pieces).toBe(1);
  });

  it("leaves out pieces over 14 h or reversed, and days with no sleep", () => {
    expect(sleepPeriods([piece(22, "08:00", 23, "08:00")])).toEqual([]);
    expect(sleepPeriods([piece(23, "08:00", 23, "07:00")])).toEqual([]);
    expect(sleepOn([], "2026-10-23", ROME)).toEqual({
      night: null,
      naps: [],
      totalMin: 0,
    });
  });

  it("puts a night on the day of its wake, whatever day it was logged on", () => {
    const pieces = [piece(26, "23:30", 27, "03:00"), piece(27, "03:50", 27, "07:02")];
    expect(sleepOn(pieces, "2026-10-26", ROME).night).toBeNull();
  });
});
