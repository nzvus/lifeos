import { describe, expect, it } from "vitest";
import {
  intakeReading,
  streakOf,
  viewOf,
  type DayState,
  type MeasureInput,
} from "./view";

// MOD-56 (bars-study §17–18; his «yc», 20 Nov): a request (frame, level) gives a view.
const WATER: MeasureInput = {
  name: "Acqua",
  reading: "amount",
  unit: "ml",
  v: 1750,
  refs: {
    target: 2500,
    zones: [
      { from: 0, level: "bad" },
      { from: 1500, level: "fair" },
      { from: 2300, level: "good" },
    ],
  },
  parts: [
    { name: "08:10", v: 500 },
    { name: "13:00", v: 750 },
    { name: "17:40", v: 500 },
  ],
  partsAdd: true,
  days: [
    { d: "lu", v: 2100 },
    { d: "ma", v: 1750 },
  ],
};

describe("the engine gives a view from a request (MOD-56)", () => {
  it("an amount in its day is a bar on the day's target; parts only from level 1 (§17.3)", () => {
    const l0 = viewOf(WATER, { frame: "day", level: 0 });
    expect(l0).toMatchObject({ piece: "tree", depth: 0, node: { t: 2500 } });
    const l1 = viewOf(WATER, { frame: "day", level: 1 });
    expect(l1).toMatchObject({ piece: "tree", depth: 1 });
    if (l1.piece === "tree") expect(l1.node.children?.nodes).toHaveLength(3);
  });

  it("an object alone is not judged by the day's references", () => {
    const own = viewOf(WATER, { frame: "own", level: 1 });
    expect(own.piece).toBe("tree");
    if (own.piece === "tree") {
      expect(own.node.t).toBeUndefined();
      expect(own.node.zones).toBeUndefined();
    }
  });

  it("over a period the same measure is a column a day, with its target", () => {
    expect(viewOf(WATER, { frame: "period", level: 0 })).toMatchObject({
      piece: "days",
      t: 2500,
      days: WATER.days,
    });
  });

  it("a score is the chip at a glance, its criteria on its 0–100 ruler when open", () => {
    const voto: MeasureInput = {
      name: "Voto",
      reading: "score",
      v: 71,
      parts: [{ name: "densità", v: 30, max: 40 }],
    };
    expect(viewOf(voto, { frame: "session", level: 0 })).toMatchObject({
      piece: "chip",
      score: 71,
    });
    expect(viewOf(voto, { frame: "session", level: 1 })).toMatchObject({
      piece: "tree",
      node: { max: 100, children: { adds: true } },
    });
  });

  it("never invents: no data draws nothing, low coverage says «non so» (PRD-22, PRD-23)", () => {
    expect(viewOf({ ...WATER, v: null }, { frame: "day", level: 0 })).toEqual({
      piece: "none",
      reason: "no-data",
    });
    expect(viewOf({ ...WATER, days: [] }, { frame: "period", level: 0 }).piece).toBe(
      "none",
    );
    expect(
      viewOf(
        { ...WATER, coverage: { have: 3, need: 5, missing: ["la cena"] } },
        { frame: "day", level: 0 },
      ),
    ).toMatchObject({ piece: "unknown", missing: ["la cena"] });
  });

  it("a reading not built yet says so instead of a home-made drawing", () => {
    expect(
      viewOf({ name: "Tipo", reading: "category", v: 1 }, { frame: "day", level: 0 }),
    ).toEqual({ piece: "none", reason: "not-built" });
  });
});

// Bars-study §19.1 (his 20 Nov: «alcuni tracker potrebbero essere dei binari … vale per qualsiasi
// cosa … obiettivi con semplici "completato" e "non completato"»; his «yc»).
describe("yes / no, for any class (MOD-56, VIS-22)", () => {
  const W = ["lu", "ma", "me", "gi", "ve", "sa", "do"];
  const week = (s: DayState[]) => s.map((x, i) => ({ d: W[i]!, s: x }));

  it("a day is the voce's own state, never a bar", () => {
    const creatina: MeasureInput = { name: "Creatina", reading: "done", v: 1 };
    expect(viewOf(creatina, { frame: "day", level: 0 })).toMatchObject({
      piece: "state",
      state: "done",
    });
    expect(
      viewOf({ ...creatina, state: "planned" }, { frame: "day", level: 0 }),
    ).toMatchObject({ state: "planned" });
  });

  it("a week is a cell a day with its streak; a month a calendar", () => {
    const states = week(["done", "missed", "done", "done", "done", "skipped", "planned"]);
    expect(streakOf(states)).toBe(0);
    expect(streakOf(week(["missed", "done", "done", "planned"]))).toBe(2);
    const v = viewOf(
      { name: "Creatina", reading: "done", v: null, states },
      {
        frame: "period",
        level: 0,
      },
    );
    expect(v).toMatchObject({ piece: "cells", grid: "week" });
    const month = Array.from({ length: 30 }, (_, i) => ({
      d: String(i + 1),
      s: "done" as const,
    }));
    expect(
      viewOf(
        { name: "C", reading: "done", v: null, states: month },
        { frame: "period", level: 0 },
      ),
    ).toMatchObject({ grid: "month", streak: 30 });
  });

  it("a goal «n volte» is n cells, the done ones filled", () => {
    const v = viewOf(
      {
        name: "Palestra 4 volte",
        reading: "done",
        v: null,
        refs: { target: 4 },
        states: week(["done", "missed", "done", "missed", "missed", "missed", "planned"]),
      },
      { frame: "period", level: 0 },
    );
    expect(v.piece === "cells" && v.cells.map((c) => c.s)).toEqual([
      "done",
      "done",
      "missed",
      "missed",
    ]);
  });

  it("a fixed dose reads as yes / no; caffeine, judged, stays an amount", () => {
    expect(intakeReading([5, 5, 5, 5], false)).toBe("done");
    expect(intakeReading([5, 3, 5], false)).toBe("amount");
    expect(intakeReading([80, 80, 80], true)).toBe("amount");
    expect(intakeReading([5, 5], false)).toBe("amount");
  });
});
