import { describe, expect, it } from "vitest";
import { sleepParts, type Night } from "./sleep";

// The developer’s nights, 15–22 October without the 18th (local, UTC+2): bed and wake as minutes of the wake day.
const at = (h: number, m: number) => h * 60 + m;
const eve = (h: number, m: number) => at(h, m) - 1440;
const week: Night[] = [
  { bed: at(1, 7), wake: at(8, 0) }, // 01:07 → 08:00, after midnight
  { bed: at(0, 27), wake: at(7, 25) },
  { bed: eve(23, 39), wake: at(9, 20) },
  { bed: at(0, 32), wake: at(7, 15) },
  { bed: at(0, 12), wake: at(5, 17) },
  { bed: eve(22, 50), wake: at(6, 10) },
  { bed: eve(23, 0), wake: at(6, 15) },
];

describe("sleep score parts", () => {
  it("scores the hours against 7–9 h, falling to 0 at 5 h", () => {
    const p = (bed: number, wake: number) =>
      sleepParts({ night: { bed, wake }, before: [], quality: null, energy: null });
    expect(p(eve(23, 0), at(7, 0)).duration).toBe(1);
    expect(p(eve(23, 0), at(5, 0)).duration).toBeCloseTo(0.5);
    expect(p(at(1, 0), at(6, 0)).duration).toBe(0);
    expect(p(eve(21, 0), at(7, 0)).duration).toBeCloseTo(0.5);
  });

  it("judges regularity against the week before, and needs three nights", () => {
    // 23 October: 00:30 → 08:00 against that week (mean bed ≈ 23:58, wake 07:06).
    const night = { bed: at(0, 30), wake: at(8, 0) };
    const p = sleepParts({ night, before: week, quality: 4, energy: 3 });
    // Gaps 31.9 and 54 min: their mean, 42.9, is 12.9 past the 30-minute band.
    expect(p.gapMin).toBeCloseTo(42.93, 1);
    expect(p.regularity).toBeCloseTo(1 - 12.93 / 90, 2);
    expect(
      sleepParts({ night, before: week.slice(0, 2), quality: null, energy: null }),
    ).toMatchObject({ regularity: null, gapMin: null });
  });

  it("reads only the last seven nights", () => {
    const odd = { bed: at(4, 0), wake: at(12, 0) };
    const night = { bed: eve(23, 0), wake: at(7, 0) };
    const a = sleepParts({ night, before: week, quality: null, energy: null });
    const b = sleepParts({ night, before: [odd, ...week], quality: null, energy: null });
    expect(b.gapMin).toBe(a.gapMin);
  });

  it("feels from quality and the morning energy, 1–5", () => {
    const night = { bed: eve(23, 0), wake: at(7, 0) };
    expect(sleepParts({ night, before: [], quality: 4, energy: 3 }).feel).toBeCloseTo(
      0.625,
    );
    expect(sleepParts({ night, before: [], quality: null, energy: 5 }).feel).toBe(1);
    expect(
      sleepParts({ night, before: [], quality: null, energy: null }).feel,
    ).toBeNull();
  });
});
