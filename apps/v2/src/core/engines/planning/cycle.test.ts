import { describe, expect, it } from "vitest";
import { apply } from "./apply";
import type { Cycle, CycleInput } from "./cycle";
import { cyclePlan } from "./cycle";
import type { Block, Model } from "./model";
import { rebase } from "./rebase";
import { resolve } from "./model";

const steps = [
  { position: 0, keys: ["push"] },
  { position: 1, keys: ["pull"] },
  { position: 2, keys: [] },
  { position: 3, keys: ["legs"] },
];
const program: Cycle = {
  steps,
  start: "2026-10-01",
  advance: "occurrence",
  onSkip: "lose",
};
const names = (input: CycleInput) =>
  cyclePlan(input).plan.map(
    (d) =>
      `${d.day.slice(8)} ${d.step.keys[0] ?? "rest"}${d.late ? "!" : ""}${d.skipped ? " skipped" : ""}`,
  );

describe("cycle by occurrence: a skipped day shifts or loses the step", () => {
  const base = {
    today: "2026-10-02",
    done: [{ day: "2026-10-01", keys: ["push"] }],
    days: 4,
  };
  it("lose (v1): the step passes", () => {
    expect(names({ ...base, cycle: program, skips: ["2026-10-02"] })).toEqual([
      "02 pull skipped",
      "03 rest",
      "04 legs",
      "05 push",
    ]);
  });
  it("shift: the step waits for the next day, and it is not late", () => {
    const shift = { ...program, onSkip: "shift" as const };
    expect(names({ ...base, cycle: shift, skips: ["2026-10-02"] })).toEqual([
      "02 pull skipped",
      "03 pull",
      "04 rest",
      "05 legs",
    ]);
    const past = { ...base, today: "2026-10-03", days: 2 };
    expect(names({ ...past, cycle: shift, skips: ["2026-10-02"] })).toEqual([
      "03 pull",
      "04 rest",
    ]);
  });
});

describe("cycle by date: dinner rotates four recipes", () => {
  const dinners: Cycle = {
    steps: ["pasta", "fish", "legumes", "pizza"].map((k, i) => ({
      position: i,
      keys: [k],
    })),
    start: "2026-10-01",
    advance: "date",
    onSkip: "lose",
  };
  it("day k holds step k mod n, whatever was done", () => {
    const done = [{ day: "2026-10-05", keys: ["pizza"] }];
    expect(names({ cycle: dinners, today: "2026-10-05", done, days: 3 })).toEqual([
      "05 pasta",
      "06 fish",
      "07 legumes",
    ]);
  });
  it("a skip loses the day's step, or shifts the rotation", () => {
    const skips = ["2026-10-03", "2026-10-06"];
    const base = { today: "2026-10-05", done: [], days: 3, skips };
    expect(names({ ...base, cycle: dinners })).toEqual([
      "05 pasta",
      "06 fish skipped",
      "07 legumes",
    ]);
    // Shift: the 3rd held the rotation back by one, and so does the 6th.
    expect(names({ ...base, cycle: { ...dinners, onSkip: "shift" } })).toEqual([
      "05 pizza",
      "06 pasta skipped",
      "07 pasta",
    ]);
  });
  it("an override changes its day only", () => {
    const overrides = [{ day: "2026-10-06", position: 3 }];
    expect(
      names({ cycle: dinners, today: "2026-10-05", done: [], days: 3, overrides }),
    ).toEqual(["05 pasta", "06 pizza", "07 legumes"]);
  });
});

describe("a block bound to a cycle", () => {
  const training: Block = {
    id: "t",
    kind: "session",
    when: { type: "at", min: 1080 },
    cycle: "prog",
  };
  const ctx = (step: { position: number; keys: string[] } | undefined) => ({
    date: "2026-10-02",
    entries: [],
    history: [],
    ...(step ? { steps: new Map([["prog", step]]) } : {}),
  });
  let n = 0;
  const id = () => `e${++n}`;
  it("takes the step due as its item; a rest or an unknown step plans nothing", () => {
    expect(
      apply([training], ctx({ position: 1, keys: ["pull"] }), id).map((e) => e.item),
    ).toEqual(["pull"]);
    expect(apply([training], ctx({ position: 2, keys: [] }), id)).toEqual([]);
    expect(apply([training], ctx(undefined), id)).toEqual([]);
  });
});

describe("rebase: changing a model's base", () => {
  const b = (id: string, min: number): Block => ({
    id,
    kind: "meal",
    when: { type: "at", min },
  });
  const models = new Map<string, Model>([
    [
      "lavoro",
      {
        id: "lavoro",
        name: "Lavoro",
        blocks: [b("colazione", 450), b("pranzo", 780), b("cena", 1200)],
      },
    ],
    [
      "palestra",
      {
        id: "palestra",
        name: "Lavoro + palestra",
        extends: "lavoro",
        blocks: [b("spuntino", 1020)],
        removes: ["cena"],
        changes: {
          pranzo: { when: { type: "at", min: 750 } },
          colazione: { item: "oats" },
        },
      },
    ],
    [
      "mio",
      {
        id: "mio",
        name: "Mio",
        extends: "palestra",
        blocks: [b("merenda", 960)],
        changes: { pranzo: { item: "riso" } },
      },
    ],
  ]);
  it("replace: inherited blocks follow the new base; a kept change is a conflict where the base differs", () => {
    // "mio" moves from Lavoro + palestra to Lavoro: lunch was 12:30 there, 13:00 here.
    const r = rebase("mio", "lavoro", "replace", models);
    expect(r.model.extends).toBe("lavoro");
    expect(r.model.blocks.map((x) => x.id)).toEqual(["merenda"]);
    expect(r.conflicts).toEqual([]); // the change is on `item`, which both bases leave unset
    const next = new Map(models).set("mio", r.model);
    expect(resolve("mio", next).blocks.map((x) => x.id)).toEqual([
      "colazione",
      "pranzo",
      "cena",
      "merenda",
    ]);
    const moved = rebase("palestra", null, "replace", models);
    expect(moved.model.extends).toBeUndefined();
  });
  it("replace names what it drops and where a change meets a different base value", () => {
    const m = new Map(models).set("x", {
      id: "x",
      name: "X",
      extends: "palestra",
      blocks: [],
      removes: ["spuntino"],
      changes: { pranzo: { when: { type: "at", min: 720 } } },
    });
    const r = rebase("x", "lavoro", "replace", m);
    expect(r.dropped).toEqual(["spuntino"]);
    expect(r.conflicts).toEqual([{ block: "pranzo", fields: ["when"] }]);
  });
  it("merge keeps what the model shows and adds only the new base's missing blocks", () => {
    const r = rebase(
      "palestra",
      "mio",
      "merge",
      new Map(models).set("mio", { ...models.get("mio")!, extends: "lavoro" }),
    );
    expect(r.model.blocks.map((x) => x.id)).toEqual(["spuntino"]);
    expect(r.model.removes).toEqual(["cena"]);
    // Lunch keeps 12:30 over the new base's rice at 13:00.
    expect(r.model.changes?.["pranzo"]).toEqual({
      when: { type: "at", min: 750 },
      item: undefined,
    });
  });
  it("unlink: the visible blocks become local, with today's values", () => {
    const r = rebase("palestra", null, "replace", models);
    expect(r.model.blocks.map((x) => [x.id, x.when])).toEqual([
      ["colazione", { type: "at", min: 450 }],
      ["pranzo", { type: "at", min: 750 }],
      ["spuntino", { type: "at", min: 1020 }],
    ]);
    expect(r.model.blocks[0]!.item).toBe("oats");
  });
  it("refuses a base built on the model itself", () => {
    expect(() => rebase("lavoro", "mio", "replace", models)).toThrow(
      /cannot extend itself/,
    );
  });
});
