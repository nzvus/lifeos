import { describe, expect, it } from "vitest";
import { viewOf, type MeasureInput } from "./view";

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
      viewOf({ name: "Fatto", reading: "done", v: 1 }, { frame: "day", level: 0 }),
    ).toEqual({ piece: "none", reason: "not-built" });
  });
});
