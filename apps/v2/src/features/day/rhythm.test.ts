import { describe, expect, it } from "vitest";
import type { Day, DayItem } from "@/core/day";
import { kindRegistry } from "@/core/kinds";
import { weekRhythm } from "./rhythm";
import type { ScoreContext } from "./score";

const reg = kindRegistry();
const item = (kind: string, over: Partial<DayItem> = {}): DayItem => ({
  id: "x",
  kind: reg.get(kind),
  family: reg.get(kind).family,
  subcategory: null,
  status: "done",
  start: null,
  end: null,
  minute: null,
  item: null,
  values: {},
  lines: [],
  children: [],
  sets: [],
  money: null,
  fulfils: null,
  tags: [],
  source: "import",
  confidence: "1",
  note: "",
  ...over,
});
const clock = { timeZone: "Europe/Rome", boundaryMin: 240 };
const ctxOf = (date: string): ScoreContext => ({
  date,
  clock,
  weighings: null,
  weightGoal: null,
  nights: [
    {
      day: "2026-10-15",
      start: new Date("2026-10-14T22:00:00Z"),
      end: new Date("2026-10-15T05:30:00Z"),
    },
  ],
  sex: null,
  now: null,
});

describe("a day's 24 hours (UI-76)", () => {
  it("draws the night, the meals in their role's colour and the sessions done, by the clock", () => {
    const d: Day = {
      day: "2026-10-15",
      clock,
      timed: [
        item("meal", { minute: 13 * 60, values: { role: "lunch" } }),
        item("meal", { minute: 20 * 60, values: { role: "dinner" }, status: "planned" }),
        item("session", {
          start: new Date("2026-10-15T15:00:00Z"),
          end: new Date("2026-10-15T16:00:00Z"),
        }),
      ],
      untimed: [],
      invalidKinds: [],
    };
    const r = weekRhythm([d], ctxOf, clock)["2026-10-15"]!;
    // 00:00–07:30 local (Rome is UTC+2 on 15 Oct): the night ending that morning.
    expect(r.bands).toEqual([{ from: 0, to: 450 }]);
    // Planned meals are not drawn.
    expect(r.meals).toEqual([{ at: 780, c: "var(--moment-lunch)" }]);
    expect(r.sessions).toEqual([{ from: 17 * 60, to: 18 * 60 }]);
  });
});
