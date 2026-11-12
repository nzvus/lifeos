import { describe, expect, it } from "vitest";
import type { Block } from "./blocks";
import { dayBlocks, lastDone, type PlanVoce } from "./day-blocks";

const block = (id: string, over: Partial<Block> = {}): Block => ({
  id,
  name: id,
  area: "Cibo",
  items: [],
  kind: null,
  defaults: {},
  when: { kind: "none" },
  durationMin: null,
  recurrence: { type: "daily" },
  ...over,
});
const items = (...ids: string[]) => ids.map((itemId) => ({ itemId, quantity: null }));
const KINDS: Record<string, string> = {
  avena: "meal",
  merluzzo: "meal",
  ceci: "meal",
  caffe: "meal",
  push: "session",
};
const kindOf = (id: string) => KINDS[id] ?? null;
let n = 0;
const voce = (over: Partial<PlanVoce>): PlanVoce => ({
  id: "v" + n++,
  day: "2026-11-10",
  kind: "meal",
  itemId: null,
  category: null,
  minute: null,
  status: "done",
  ...over,
});
const DAY = "2026-11-10"; // a Tuesday

describe("the Piano of a day from blocchi (PL-40)", () => {
  it("PL-01 / PL-40: «AVENA · ogni giorno 07:30» is planned at 07:30 until the day has its voce", () => {
    const colazione = block("colazione", {
      items: items("avena"),
      when: { kind: "time", atMin: 450 },
    });
    const planned = dayBlocks({
      day: DAY,
      blocks: [colazione],
      kindOf,
      voci: [],
      history: [],
    });
    expect(planned).toMatchObject([
      { key: "block:colazione", itemId: "avena", kind: "meal", minute: 450 },
    ]);
    // Any status covers it: a skipped breakfast is not planned again.
    for (const status of ["done", "planned", "skipped"] as const)
      expect(
        dayBlocks({
          day: DAY,
          blocks: [colazione],
          kindOf,
          voci: [voce({ itemId: "avena", status, minute: 470 })],
          history: [],
        }),
      ).toEqual([]);
  });

  it("PL-02: a rotation takes the object after the last one done", () => {
    const cena = block("cena", { items: items("merluzzo", "ceci") });
    const yesterday = voce({ day: "2026-11-09", itemId: "merluzzo", minute: 1200 });
    expect(lastDone([cena], [yesterday]).get("cena")).toBe("merluzzo");
    const [p] = dayBlocks({
      day: DAY,
      blocks: [cena],
      kindOf,
      voci: [],
      history: [yesterday],
    });
    expect(p).toMatchObject({ itemId: "ceci" });
    // An archived object leaves the rotation.
    const [q] = dayBlocks({
      day: DAY,
      blocks: [cena],
      kindOf,
      live: new Set(["merluzzo"]),
      voci: [],
      history: [yesterday],
    });
    expect(q).toMatchObject({ itemId: "merluzzo" });
  });

  it("PL-03: an abitudine is covered by a voce of its type and category, any status", () => {
    const studio = block("studio", {
      area: "Mente",
      kind: "activity",
      defaults: { category: "study" },
    });
    const walk = voce({ kind: "activity", category: "walk" });
    expect(
      dayBlocks({ day: DAY, blocks: [studio], kindOf, voci: [walk], history: [] }),
    ).toMatchObject([{ key: "block:studio", kind: "activity", itemId: null }]);
    const study = voce({ kind: "activity", category: "study", status: "skipped" });
    expect(
      dayBlocks({ day: DAY, blocks: [studio], kindOf, voci: [study], history: [] }),
    ).toEqual([]);
  });

  it("PL-11 / PL-30: caffè 30 min before the session: from its previsto time, then its fatto one", () => {
    const palestra = block("palestra", {
      area: "Corpo",
      items: items("push"),
      when: { kind: "time", atMin: 480 },
    });
    const caffe = block("caffe", {
      items: items("caffe"),
      when: { kind: "before", anchorId: "palestra", offsetMin: 30 },
    });
    const ahead = dayBlocks({
      day: DAY,
      blocks: [palestra, caffe],
      kindOf,
      voci: [],
      history: [],
    });
    expect(ahead.map((p) => [p.key, p.minute])).toEqual([
      ["block:caffe", 450],
      ["block:palestra", 480],
    ]);
    // The session done at 08:40: the still-previsto caffè moves to 08:10.
    const done = voce({ kind: "session", itemId: "push", minute: 520 });
    expect(
      dayBlocks({
        day: DAY,
        blocks: [palestra, caffe],
        kindOf,
        voci: [done],
        history: [],
      }),
    ).toMatchObject([{ key: "block:caffe", minute: 490 }]);
  });

  it("PL-12: no time → the earliest time on the last same weekday he did that blocco, never a fixed hour", () => {
    const pranzo = block("pranzo", { items: items("merluzzo") });
    const history = [
      voce({ day: "2026-11-03", itemId: "merluzzo", minute: 790 }),
      voce({ day: "2026-11-03", itemId: "merluzzo", minute: 760 }),
      voce({ day: "2026-11-09", itemId: "merluzzo", minute: 700 }),
    ];
    expect(
      dayBlocks({ day: DAY, blocks: [pranzo], kindOf, voci: [], history })[0]!.minute,
    ).toBe(760);
    expect(
      dayBlocks({ day: DAY, blocks: [pranzo], kindOf, voci: [], history: [] })[0]!.minute,
    ).toBeNull();
  });

  it("PL-30 / PL-33: a ciclo's step plans its scheda; a session that day covers it", () => {
    const steps = [{ cycleId: "pplcr", label: "Push", itemId: "push" }];
    const lastTuesday = voce({
      day: "2026-11-03",
      kind: "session",
      itemId: "push",
      minute: 1080,
    });
    expect(
      dayBlocks({
        day: DAY,
        blocks: [],
        kindOf,
        voci: [],
        history: [lastTuesday],
        steps,
      }),
    ).toMatchObject([
      { key: "step:pplcr", step: { label: "Push" }, kind: "session", minute: 1080 },
    ]);
    const trained = voce({ kind: "session", itemId: "legs", minute: 600 });
    expect(
      dayBlocks({ day: DAY, blocks: [], kindOf, voci: [trained], history: [], steps }),
    ).toEqual([]);
  });

  it("PL-01: a blocco that holds nothing, or only archived objects, plans nothing", () => {
    const empty = block("vuoto", { when: { kind: "time", atMin: 600 } });
    const gone = block("finito", { items: items("avena") });
    expect(
      dayBlocks({
        day: DAY,
        blocks: [empty, gone],
        kindOf,
        live: new Set(),
        voci: [],
        history: [],
      }),
    ).toEqual([]);
  });

  it("PL-20: a blocco whose frequency does not fall on the day plans nothing", () => {
    const lun = block("lun", {
      items: items("avena"),
      recurrence: { type: "weekdays", days: [1] },
    });
    expect(dayBlocks({ day: DAY, blocks: [lun], kindOf, voci: [], history: [] })).toEqual(
      [],
    );
  });
  it("PL-30 / PL-11 (Q-18 (a)): a step's blocchi «nel ciclo» are planned on its day only, the caffè 30 min before the Push", () => {
    const inCycle = { type: "inCycle" } as const;
    const push = block("b-push", {
      area: "Corpo",
      items: items("push"),
      when: { kind: "time", atMin: 480 },
      recurrence: inCycle,
    });
    const caffe = block("b-caffe", {
      items: items("caffe"),
      when: { kind: "before", anchorId: "b-push", offsetMin: 30 },
      recurrence: inCycle,
    });
    const step = {
      cycleId: "plprr",
      label: "Push",
      itemId: "push",
      blockIds: ["b-push", "b-caffe"],
    };
    const planned = dayBlocks({
      day: DAY,
      blocks: [push, caffe],
      kindOf,
      voci: [],
      history: [],
      steps: [step],
    });
    expect(planned).toMatchObject([
      { key: "block:b-caffe", itemId: "caffe", minute: 450, step: { label: "Push" } },
      { key: "block:b-push", itemId: "push", minute: 480, step: { label: "Push" } },
    ]);
    // On Rest (no step due) a blocco «nel ciclo» plans nothing by itself.
    expect(
      dayBlocks({ day: DAY, blocks: [push, caffe], kindOf, voci: [], history: [] }),
    ).toEqual([]);
    // The session done at 08:40 covers the Push; the caffè follows its fatto time (PL-11).
    const done = voce({ kind: "session", itemId: "push", minute: 520 });
    expect(
      dayBlocks({
        day: DAY,
        blocks: [push, caffe],
        kindOf,
        voci: [done],
        history: [],
        steps: [step],
      }),
    ).toMatchObject([{ key: "block:b-caffe", minute: 490 }]);
  });
});
