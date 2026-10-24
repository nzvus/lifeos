import { describe, expect, it } from "vitest";
import { F } from "@lifeos/kit";
import { energyBoxes } from "./energy";

// The developer's automatic week of 19 Oct.
const week = {
  source: "auto",
  to: "2026-10-18",
  expenditureKcal: 2533,
  sigmaKcal: 224,
  loggedDays: 20,
  priors: { bmr: 1792, everyday: 120, steps: 260, training: 110, tef: 250 },
};

describe("Andamento → Energia", () => {
  it("what was learnt, ± how sure, and the gap from the priors' sum", () => {
    const e = energyBoxes(week, "2026-10-19")!;
    expect(e.learnt.value).toBe(F.n(2533, 0) + " ± " + F.num(224, "kcal"));
    // 1 792 + 120 + 260 + 110 + 250 = 2 532: one kcal apart.
    expect(e.learnt.meta).toContain("lo scarto è " + F.signed(1, "kcal"));
    expect(e.priors.map((p) => p.title)).toEqual([
      "Base (a riposo)",
      "La giornata (seduto, in piedi)",
      "Passi",
      "Palestra, serie per serie",
      "Digerire (effetto termico)",
    ]);
  });

  it("nothing for a v1 check-in or no week", () => {
    expect(energyBoxes({ kcal: "2778" }, "2026-10-10")).toBeNull();
    expect(energyBoxes(null, "2026-10-19")).toBeNull();
  });
});
