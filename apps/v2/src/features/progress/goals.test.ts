import { describe, expect, it } from "vitest";
import type { Goal } from "@/core/goals";
import { goalText, goalTitle } from "./goals";

const goal = (over: Partial<Goal>): Goal => ({
  id: "g",
  source: "steps",
  metric: {},
  target: "at_least",
  value: 8000,
  low: null,
  high: null,
  by: null,
  since: "2026-10-16",
  ...over,
});
const plain = (s: string) => s.replace(/ /g, " ");

describe("a goal in words", () => {
  it("says what it asks", () => {
    const steps = goal({
      metric: { what: "passi", unit: "passi", per: "day", days: "weekdays" },
    });
    expect(goalTitle(steps)).toBe("Passi");
    expect(plain(goalText(steps))).toBe(
      "almeno 8.000 passi al giorno, nei giorni feriali",
    );
    const w = goal({ source: "weight", target: "reach", value: 72.3, by: "2026-12-20" });
    expect(plain(goalText(w))).toMatch(/^arrivare a 72,3 kg entro il 20 dic/);
    expect(
      plain(
        goalText(
          goal({
            source: "weightRatePctWeek",
            target: "range",
            low: -0.05,
            high: 0.05,
            value: null,
          }),
        ),
      ),
    ).toBe("tra −0,05 e 0,05 % a settimana");
  });
});
