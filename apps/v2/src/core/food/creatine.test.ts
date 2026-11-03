import { describe, expect, it } from "vitest";
import { addDays } from "../engines/time";
import { creatineOn, creatineWords } from "./creatine";

/** His October: 3,41 g a day from 5 to 24 Oct, 17 Oct skipped (dossiers/compounds.md §8). */
const october = new Map<string, number>();
for (let d = "2026-10-05"; d <= "2026-10-24"; d = addDays(d, 1))
  if (d !== "2026-10-17") october.set(d, 3.41);
const pct = (day: string) => Math.round(creatineOn(october, day, 72)!.stores * 100);

describe("creatine stores day by day (FOOD-40)", () => {
  it("fill at 3,4 g a day and dip on a skipped day (tests 8.1)", () => {
    expect(pct("2026-10-16")).toBe(59);
    expect(pct("2026-10-17")).toBe(56);
    expect(creatineOn(october, "2026-10-17", 72)!.trend).toBe("down");
    expect(pct("2026-10-18")).toBe(59);
    expect(pct("2026-10-24")).toBe(76);
    expect(creatineWords(creatineOn(october, "2026-10-24", 72)!)).toBe(
      "scorte ≈ 76 % · in aumento",
    );
  });

  it("empty after stopping, and say since when (test 8.2)", () => {
    const c = creatineOn(october, "2026-11-03", 72)!;
    expect(Math.round(c.stores * 100)).toBe(41);
    expect(creatineWords(c)).toBe("scorte ≈ 41 % · in calo da 10 giorni");
  });

  it("are full in a few days of loading, and say nothing when never taken", () => {
    const load = new Map<string, number>();
    for (let i = 0; i < 4; i++) load.set(addDays("2026-11-01", i), 20);
    expect(creatineOn(load, "2026-11-04", 72)!.trend).toBe("full");
    expect(creatineOn(new Map(), "2026-11-04", 72)).toBeNull();
  });
});

describe("his usual bedtime (compounds.md §4)", () => {
  it("is the median start of his nights, after midnight as 24 h +; unknown under 3", async () => {
    const { usualBedMinute } = await import("./compounds");
    const m = (iso: string) => new Date(iso);
    const local = (d: Date) => (d.getUTCHours() * 60 + d.getUTCMinutes() + 120) % 1440;
    const nights = [
      "2026-10-01T23:17:00Z",
      "2026-10-02T21:59:00Z",
      "2026-10-03T22:45:00Z",
    ].map(m);
    expect(usualBedMinute(nights, local)).toBe(24 * 60 + 45);
    expect(usualBedMinute(nights.slice(0, 2), local)).toBeNull();
  });
});
