import { describe, expect, it } from "vitest";
import type { PricedDay } from "@/core/energy";
import { burnText, dayBurnLine, dayPieces, dayTotalText, rowBurns, tuneOf } from "./burn";

const r = (low: number, high: number) => ({ low, high });
// F joins numbers and units with no-break spaces.
const plain = (s: string | null) => s?.replace(/\u00a0/g, " ") ?? null;
// A day priced like 27 Oct: base, 15 000 steps, the Push (energy-day.md §8).
const day: PricedDay = {
  day: "2026-10-27",
  feet: { hours: 3.5, source: "median" },
  sessions: [{ id: "push", burn: r(339, 503), prior: r(254, 377), tail: r(20, 40) }],
  prior: {
    bmr: 1800,
    baseline: r(2115, 2313),
    tef: r(180, 220),
    steps: r(452, 598),
    training: r(274, 417),
    total: r(2841, 3328),
  },
};

describe("burnText", () => {
  it("rounds a range to 10 kcal", () => {
    expect(plain(burnText(r(254, 377)))).toBe("≈ 250–380 kcal");
  });
  it("never narrower than ±15 %: a point becomes a range", () => {
    expect(plain(burnText(r(240, 240)))).toBe("≈ 200–280 kcal");
  });
  it("says nothing under 10 kcal or without a range", () => {
    expect(burnText(r(0, 4))).toBeNull();
    expect(burnText(null)).toBeNull();
  });
});

describe("rowBurns", () => {
  it("a session shows its own cost (not × 0.75), the steps under «steps»", () => {
    const m = rowBurns(day);
    expect(m.get("push")).toEqual(r(339, 503));
    expect(m.get("steps")).toEqual(r(452, 598));
  });
});

describe("dayBurnLine", () => {
  it("a past day: its total and the hours on feet, marked as an estimate", () => {
    expect(plain(dayBurnLine(day, null))).toBe(
      "Speso ≈ 2.620–3.550 kcal · 3,5 h in piedi (stima), per lo più seduto",
    );
  });
  it("today at noon: half the everyday part plus what was done, then the whole day", () => {
    // 0.5 × (2115–2313) + steps + training = 1783.5–2171.5, widened to ±15 %
    expect(plain(dayBurnLine(day, 0.5))).toBe(
      "Speso finora ≈ 1.680–2.270 kcal · a fine giornata ≈ 2.620–3.550 kcal · 3,5 h in piedi (stima), per lo più seduto",
    );
  });
});

describe("dayBurnLine with planned sessions", () => {
  it("adds them to the day's end and says so", () => {
    expect(plain(dayBurnLine(day, 0.5, { count: 1, prior: r(200, 300) }))).toBe(
      "Speso finora ≈ 1.680–2.270 kcal · a fine giornata ≈ 2.830–3.830 kcal con 1 sessione prevista · 3,5 h in piedi (stima), per lo più seduto",
    );
  });
});

describe("dayPieces", () => {
  it("base, the day from the hours on feet, steps, training, digesting", () => {
    const rows = dayPieces(day);
    expect(rows.map((e) => e.title)).toEqual([
      "Base (a riposo)",
      "La giornata",
      "Passi",
      "Allenamento",
      "Digerire",
    ]);
    expect(plain(rows[1]!.meta ?? "")).toBe(
      "3,5 h in piedi, tua mediana di 14 giorni · per lo più seduto",
    );
  });
  it("the pieces add up to the day: base + day + steps + training (digesting is inside the day factor)", () => {
    const p = day.prior;
    const everyday = p.baseline.low - p.bmr - p.tef!.low;
    expect(p.bmr + everyday + p.tef!.low + p.steps!.low + p.training.low).toBeCloseTo(
      p.total.low,
      6,
    );
  });
});

describe("one calibrated number (ledger BODY-30)", () => {
  // The week learnt 2.663 ± 276 where its priors said 2.865: k ≈ 0,93.
  const tune = tuneOf({ expenditureKcal: 2663, sigmaKcal: 276, priorKcal: 2865 })!;

  it("calibrates by learnt ÷ priors, and refuses without both or when absurd", () => {
    expect(tune.k).toBeCloseTo(0.9295, 3);
    expect(tuneOf({ expenditureKcal: 2663 })).toBeNull();
    expect(tuneOf({ expenditureKcal: 2663, priorKcal: 1000 })).toBeNull();
    expect(tuneOf(null)).toBeNull();
  });

  it("the day's total is one number with the week's ± in proportion", () => {
    // mid 3.084,5 × 0,9295 = 2.867 → 2.870; ± 2.870 × 276 / 2.663 ≈ 297 → 300.
    expect(plain(dayTotalText(day, tune))).toBe("≈ 2.870 kcal ± 300");
    expect(plain(dayTotalText(day))).toBe("≈ 2.620–3.550 kcal");
  });

  it("each piece and row is one number scaled the same way, and the line says so", () => {
    expect(plain(burnText(r(254, 377), tune))).toBe("≈ 290 kcal");
    expect(plain(dayPieces(day, tune)[0]!.value)).toBe("1.670 kcal");
    expect(plain(dayBurnLine(day, null, null, tune))).toContain(
      "tarato sulle tue pesate (× 0,93)",
    );
  });
});
