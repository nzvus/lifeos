import { describe, expect, it } from "vitest";
import { goalLine } from "./goal-line";

const plain = (s: string) => s.replace(/ /g, " ");
const p = {
  start: 80,
  now: 77.8,
  target: 72,
  done: 0.27,
  pace: -0.4,
  needed: -0.62,
  eta: null,
  onTrack: false,
};

describe("the goal's line on Oggi", () => {
  it("now → target by the date, the pace and the one it needs", () => {
    expect(plain(goalLine(p, "2026-12-31"))).toBe(
      "77,8 → 72 kg entro il 31 dic · vai a −0,4 kg/sett., ne servono −0,62 kg/sett.",
    );
  });

  it("says what is missing, and when it is reached", () => {
    expect(plain(goalLine({ ...p, pace: null, onTrack: null }, null))).toBe(
      "77,8 → 72 kg · servono 4 pesate in 4 settimane per il ritmo",
    );
    expect(plain(goalLine({ ...p, now: 72.1 }, null))).toBe(
      "72,1 → 72 kg · obiettivo raggiunto: ora tenerlo",
    );
  });
});
