import { describe, expect, it } from "vitest";
import type { Goal } from "@/core/goals";
import { goalRow, weekDays } from "./goal-rows";

const plain = (s: unknown) => JSON.parse(JSON.stringify(s).replace(/ /g, " "));
const goal = (over: Partial<Goal>): Goal => ({
  id: "g",
  source: "weight",
  metric: {},
  target: "reach",
  value: 72.3,
  low: null,
  high: null,
  by: "2026-12-20",
  since: "2026-10-10",
  ...over,
});

describe("each goal as the board draws it", () => {
  it("the weight: now → target, by when, the paces, how far along, what today asks", () => {
    const row = plain(
      goalRow(
        goal({}),
        {
          type: "weight",
          p: {
            start: 77,
            now: 76.3,
            target: 72.3,
            done: 0.15,
            pace: 0.18,
            needed: -0.48,
            eta: null,
            onTrack: false,
          },
        },
        { kcal: 2211, protein: 167 },
      ),
    );
    expect(row).toMatchObject({
      fam: "body",
      value: "76,3 → 72,3 kg",
      meta: "entro il 20 dicembre · servono −0,48 kg/sett. · vai a +0,18 kg/sett.",
      strip: [{ w: 15 }],
    });
    expect(row.pills.map((p: { t: string }) => p.t)).toEqual([
      "da qui: 2.211 kcal e 167 g al giorno",
      "fuori ritmo",
    ]);
  });

  it("steps on weekdays: the week's days coloured, the days short named", () => {
    const days = weekDays(
      [
        { day: "2026-10-19", n: 9000 },
        { day: "2026-10-20", n: 6000 },
        { day: "2026-10-20", n: 1000 },
      ],
      "2026-10-21",
      true,
    );
    expect(days.filter((d) => d.counts)).toHaveLength(5);
    const row = plain(
      goalRow(
        goal({
          source: "steps",
          target: "at_least",
          value: 8000,
          by: null,
          metric: { per: "day", days: "weekdays" },
        }),
        { type: "days", days },
      ),
    );
    expect(row.value).toBe("1 su 3");
    expect(row.meta).toBe("questa settimana · sotto martedì 20 (7.000)");
    expect(row.strip).toHaveLength(5);
  });

  it("a goal nothing counts yet is faded", () => {
    expect(goalRow(goal({ source: "reading" }), null)).toMatchObject({
      value: "nessun dato",
      faded: true,
    });
  });
});
