import { describe, expect, it } from "vitest";
import type { DayContext, DayEntry } from "./apply";
import { apply, defaultTime, swap } from "./apply";
import type { Block, Model } from "./model";
import { resolve } from "./model";
import { clockMin } from "./time";

const h = (hh: number, mm = 0) => hh * 60 + mm;

const breakfast: Block = {
  id: "b",
  kind: "meal",
  when: { type: "afterWake", offsetMin: 30 },
};
const lunch: Block = { id: "l", kind: "meal", when: { type: "at", min: h(13) } };
const work: Block = {
  id: "w",
  kind: "activity",
  when: { type: "at", min: h(9) },
  durationMin: 480,
};
const session: Block = {
  id: "s",
  kind: "session",
  when: { type: "unset" },
  durationMin: 75,
};
const pre: Block = {
  id: "pre",
  kind: "meal",
  when: { type: "after", anchor: "s", offsetMin: -90 },
};
const post: Block = {
  id: "post",
  kind: "meal",
  when: { type: "after", anchor: "s", offsetMin: 40 },
};

const models = new Map<string, Model>([
  ["lavoro", { id: "lavoro", name: "Lavoro", blocks: [breakfast, lunch, work] }],
  [
    "palestra",
    {
      id: "palestra",
      name: "Lavoro + palestra",
      extends: "lavoro",
      blocks: [session, pre, post],
      changes: { l: { when: { type: "at", min: h(12, 30) } } },
    },
  ],
  [
    "smart",
    {
      id: "smart",
      name: "Smart working",
      extends: "palestra",
      blocks: [],
      removes: ["w"],
    },
  ],
]);

describe("resolve: a model stores only its differences", () => {
  it("inherits the base, changes fields, adds its own blocks", () => {
    const r = resolve("palestra", models);
    expect(r.blocks.map((b) => [b.id, b.origin])).toEqual([
      ["b", "base"],
      ["l", "changed"],
      ["w", "base"],
      ["s", "local"],
      ["pre", "local"],
      ["post", "local"],
    ]);
    expect(r.blocks[1]!.when).toEqual({ type: "at", min: h(12, 30) });
  });
  it("follows every level; a removed block stays in the base and is listed for the way back", () => {
    const r = resolve("smart", models);
    expect(r.blocks.map((b) => b.id)).toEqual(["b", "l", "s", "pre", "post"]);
    expect(r.blocks.every((b) => b.origin === "base")).toBe(true);
    expect(r.removed.map((b) => b.id)).toEqual(["w"]);
    expect(resolve("lavoro", models).blocks.map((b) => b.id)).toEqual(["b", "l", "w"]);
  });
  it("editing the base changes every model built on it, except where it has its own value", () => {
    const edited = new Map(models);
    edited.set("lavoro", {
      ...models.get("lavoro")!,
      blocks: [breakfast, { ...lunch, when: { type: "at", min: h(14) } }, work],
    });
    const lunchOf = (id: string) =>
      resolve(id, edited).blocks.find((b) => b.id === "l")!.when;
    expect(lunchOf("lavoro")).toEqual({ type: "at", min: h(14) });
    expect(lunchOf("palestra")).toEqual({ type: "at", min: h(12, 30) });
  });
  it("names removals and changes the base no longer has", () => {
    const m = new Map(models);
    m.set("x", { id: "x", name: "X", extends: "lavoro", blocks: [], removes: ["gone"] });
    expect(resolve("x", m).stale).toEqual(["gone"]);
  });
  it("refuses a loop and a block both inherited and local", () => {
    const loop = new Map(models);
    loop.set("lavoro", { ...models.get("lavoro")!, extends: "smart" });
    expect(() => resolve("smart", loop)).toThrow(/cannot extend itself/);
    const clash = new Map(models);
    clash.set("y", { id: "y", name: "Y", extends: "lavoro", blocks: [lunch] });
    expect(() => resolve("y", clash)).toThrow(/both inherited and local/);
  });
});

let n = 0;
const id = () => `e${++n}`;
const tue = "2026-10-20";
const ctx = (over: Partial<DayContext> = {}): DayContext => ({
  date: tue,
  entries: [],
  wake: h(7),
  history: [],
  ...over,
});
const at = (es: DayEntry[]) => Object.fromEntries(es.map((e) => [e.fromBlock, e.at]));
const blocks = resolve("palestra", models).blocks;

describe("apply: planned entries linked to their blocks", () => {
  it("places absolute, after-wake and relative blocks; an unplaceable session has no time", () => {
    const es = apply(blocks, ctx(), id);
    expect(es.every((e) => e.status === "planned" && e.day === tue)).toBe(true);
    expect(at(es)).toEqual({
      b: h(7, 30),
      l: h(12, 30),
      w: h(9),
      s: undefined,
      pre: undefined,
      post: undefined,
    });
  });
  it("the session takes its last Tuesday time, and the meals follow it (not v1's 17:30)", () => {
    const history: DayEntry[] = [
      {
        id: "x1",
        kind: "session",
        day: "2026-10-06",
        at: h(18),
        status: "done",
        fromBlock: "s",
      },
      {
        id: "x2",
        kind: "session",
        day: "2026-10-13",
        at: h(19),
        status: "done",
        fromBlock: "s",
      },
      {
        id: "x3",
        kind: "session",
        day: "2026-10-15",
        at: h(7),
        status: "done",
        fromBlock: "s",
      },
    ];
    const t = at(apply(blocks, ctx({ history }), id));
    expect([t.s, t.pre, t.post]).toEqual([h(19), h(17, 30), h(19, 40)]);
  });
  it("relative blocks read the real start first, then the planned one", () => {
    const planned: DayEntry = {
      id: "p",
      kind: "session",
      day: tue,
      at: h(18),
      status: "planned",
      fromBlock: "s",
    };
    const done: DayEntry = { ...planned, id: "d", at: h(18, 25), status: "done" };
    expect(at(apply(blocks, ctx({ entries: [planned] }), id)).post).toBe(h(18, 40));
    expect(at(apply(blocks, ctx({ entries: [planned, done] }), id)).post).toBe(h(19, 5));
  });
  it("a block already on the day is not planned again", () => {
    const eaten: DayEntry = {
      id: "e",
      kind: "meal",
      day: tue,
      at: h(8),
      status: "done",
      fromBlock: "b",
    };
    expect(
      apply(blocks, ctx({ entries: [eaten] }), id).map((e) => e.fromBlock),
    ).not.toContain("b");
  });
  it("a late block crosses midnight without wrapping: 00:30 is 1470", () => {
    const late: Block = {
      id: "snack",
      kind: "meal",
      when: { type: "beforeBed", offsetMin: 30 },
    };
    const [e] = apply([late], ctx({ bed: h(25) }), id);
    expect([e!.at, clockMin(e!.at!)]).toEqual([1470, 30]);
  });
  it("anchors in a loop fall back to the default time", () => {
    const a: Block = {
      id: "a",
      kind: "x",
      when: { type: "after", anchor: "c", offsetMin: 10 },
    };
    const c: Block = {
      id: "c",
      kind: "x",
      when: { type: "after", anchor: "a", offsetMin: 10 },
    };
    const es = apply([a, c], ctx({ kindDefault: new Map([["x", h(10)]]) }), id);
    expect(es.every((e) => e.at !== undefined)).toBe(true);
  });
});

describe("defaultTime", () => {
  it("block first, then kind, on the same weekday, then the kind's default", () => {
    const history: DayEntry[] = [
      { id: "k", kind: "session", day: "2026-10-13", at: h(20), status: "done" },
      { id: "z", kind: "session", day: "2026-10-13", at: h(17), status: "skipped" },
    ];
    expect(defaultTime(session, ctx({ history }))).toBe(h(20));
    expect(
      defaultTime(session, ctx({ kindDefault: new Map([["session", h(18)]]) })),
    ).toBe(h(18));
    expect(defaultTime(session, ctx())).toBeUndefined();
  });
});

describe("swap mid-day", () => {
  const lavoro = resolve("lavoro", models).blocks;
  it("keeps done, skipped, typed and past planned entries; replaces the model's planned ones ahead", () => {
    const today: DayEntry[] = [
      { id: "1", kind: "meal", day: tue, at: h(7, 40), status: "done", fromBlock: "b" },
      {
        id: "2",
        kind: "activity",
        day: tue,
        at: h(9),
        status: "planned",
        fromBlock: "w",
      },
      { id: "3", kind: "meal", day: tue, at: h(13), status: "planned", fromBlock: "l" },
      { id: "4", kind: "water", day: tue, at: h(15), status: "planned" },
      { id: "5", kind: "meal", day: tue, at: h(16), status: "skipped", fromBlock: "x" },
    ];
    const s = swap(blocks, ctx({ entries: today, history: [] }), h(11), id);
    expect(s.remove.map((e) => e.id)).toEqual(["3"]);
    // Lunch moves to 12:30; the session has no time, so it sits at the end of the day.
    expect(s.add.map((e) => [e.fromBlock, e.at])).toEqual([
      ["l", h(12, 30)],
      ["s", undefined],
      ["pre", undefined],
      ["post", undefined],
    ]);
    expect(s.undo).toEqual({ remove: s.add.map((e) => e.id), restore: [today[2]] });
  });
  it("a new block behind now is not planned in the past", () => {
    const s = swap(lavoro, ctx(), h(10), id);
    expect(s.add.map((e) => e.fromBlock)).toEqual(["l"]);
  });
  it("on a future day every planned entry from a model is replaced", () => {
    const planned: DayEntry = {
      id: "9",
      kind: "meal",
      day: tue,
      at: h(8),
      status: "planned",
      fromBlock: "b",
    };
    const s = swap(lavoro, ctx({ entries: [planned] }), -Infinity, id);
    expect(s.remove).toEqual([planned]);
    expect(s.add.map((e) => e.fromBlock)).toEqual(["b", "l", "w"]);
  });
});
