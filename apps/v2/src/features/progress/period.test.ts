import { describe, expect, it } from "vitest";
import type { NutrientsData } from "@lifeos/kit";
import { period } from "./period";

const day = (kcal: number, protein: number, t = 2000): NutrientsData => ({
  kcal: { v: kcal, t },
  macros: [{ key: "protein", v: protein, t: 150 }],
  limits: [{ key: "salt", v: 5, t: 6 }],
});

describe("«Il periodo»", () => {
  it("averages the days with something eaten, and lists every day", () => {
    const p = period([
      { day: "2026-10-15", nutrients: day(2000, 140) },
      { day: "2026-10-16", nutrients: day(0, 0) },
      { day: "2026-10-17", nutrients: day(2400, 160, 2200) },
      { day: "2026-10-18", nutrients: null },
    ]);
    expect(p.logged).toBe(2);
    expect(p.nutrients).toEqual({
      kcal: { v: 2200, t: 2100 },
      macros: [{ key: "protein", v: 150, t: 150 }],
      limits: [{ key: "salt", v: 5, t: 6 }],
    });
    expect(p.rows.map((r) => r.kcal)).toEqual([2000, null, 2400, null]);
    expect(period([{ day: "2026-10-18", nutrients: null }]).nutrients).toBeNull();
  });
});
