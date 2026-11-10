import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { act } from "../verbs";
import {
  blocksOn,
  blockWhen,
  listBlocks,
  parseRecurrence,
  readBlocks,
  readBlockWhat,
  setBlockWhat,
  type Block,
} from "./blocks";

const block = (id: string, items: string[], recurrence: Block["recurrence"]): Block => ({
  id,
  name: id,
  area: "Cibo",
  items: items.map((itemId) => ({ itemId, quantity: null })),
  kind: null,
  defaults: {},
  when: { kind: "none" },
  durationMin: null,
  recurrence,
});

describe("blocchi as the Piano reads them (MOD-36, ADR-0062)", () => {
  it("PL-20 a stored recurrence is the engine's, anything else is none", () => {
    expect(parseRecurrence('{"type":"weekdays","days":[1,3,5]}')).toEqual({
      type: "weekdays",
      days: [1, 3, 5],
    });
    expect(parseRecurrence('{"type":"weekdays","days":[9]}')).toBeNull();
    expect(parseRecurrence("ogni giorno")).toBeNull();
  });
  it("PL-10 a blocco's when from its values; an incomplete one is none", () => {
    expect(blockWhen({ when: "time", at: "07:30" })).toEqual({
      kind: "time",
      atMin: 450,
    });
    expect(blockWhen({ when: "before", anchor: "b1", offsetMin: "30" })).toEqual({
      kind: "before",
      anchorId: "b1",
      offsetMin: 30,
    });
    expect(blockWhen({ when: "after" })).toEqual({ kind: "none" });
    expect(blockWhen({})).toEqual({ kind: "none" });
  });
  it("PL-40 / PL-02 the blocchi of a day; a rotation takes the item after the last done", () => {
    const breakfast = block("colazione", ["avena"], { type: "daily" });
    const dinner = block("cena", ["merluzzo", "ceci"], { type: "daily" });
    const gym = block("palestra", ["push"], { type: "weekdays", days: [1, 3, 5] });
    const flexible = block("corsa", [], { type: "timesPerWeek", n: 3 });
    const all = [breakfast, dinner, gym, flexible];
    // 2026-11-09 is a Monday, 2026-11-10 a Tuesday.
    expect(blocksOn(all, "2026-11-09").map((d) => [d.block.id, d.itemId])).toEqual([
      ["colazione", "avena"],
      ["cena", "merluzzo"],
      ["palestra", "push"],
    ]);
    const done = new Map([["cena", "merluzzo"]]);
    expect(blocksOn(all, "2026-11-10", done).map((d) => [d.block.id, d.itemId])).toEqual([
      ["colazione", "avena"],
      ["cena", "ceci"],
    ]);
    // An item no longer live is skipped.
    expect(blocksOn([dinner], "2026-11-10", done, new Set(["merluzzo"]))[0]!.itemId).toBe(
      "merluzzo",
    );
  });
});

describe("readBlocks (MOD-36)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
  });
  afterAll(() => close());

  it("a blocco made through core/verbs, its object a part, read back for its owner only", async () => {
    const meal = await act(db, a, "create", "recipe", null, { name: "Porridge" });
    if (!meal.ok) throw new Error(meal.refused);
    const made = await act(db, a, "create", "block", null, {
      name: "Colazione",
      values: {
        area: "Cibo",
        when: "time",
        at: "07:30",
        recurrence: '{"type":"daily"}',
      },
    });
    if (!made.ok) throw new Error(made.refused + " " + (made.detail ?? ""));
    await db.insert(s.catalogParts).values({
      userId: a.id,
      itemId: made.id,
      position: 0,
      partItemId: meal.id,
      quantity: "1",
    });
    const read = await readBlocks(db, a);
    expect(read).toEqual([
      expect.objectContaining({
        id: made.id,
        name: "Colazione",
        area: "Cibo",
        items: [{ itemId: meal.id, quantity: "1.00" }],
        when: { kind: "time", atMin: 450 },
        recurrence: { type: "daily" },
      }),
    ]);
    expect(await readBlocks(db, b)).toEqual([]);
    // A blocco with a broken recurrence is not part of the Piano.
    await act(db, a, "create", "block", null, {
      name: "Rotto",
      values: { area: "Oggi", recurrence: "ogni tanto" },
    });
    expect((await readBlocks(db, a)).map((x) => x.name)).toEqual(["Colazione"]);
  });

  it("PL-01 / PL-02 / PL-03 what it holds: objects in order with servings, or one type; never another's", async () => {
    const made = await act(db, a, "create", "block", null, {
      name: "Cena",
      values: { area: "Cibo", recurrence: '{"type":"daily"}' },
    });
    if (!made.ok) throw new Error(made.refused);
    const mk = async (o: Owner, catalog: string, name: string) =>
      (
        await db
          .insert(s.catalogItems)
          .values({ userId: o.id, catalog, name })
          .returning({ id: s.catalogItems.id })
      )[0]!.id;
    const sugo = await mk(a, "recipe", "MERLUZZO al sugo");
    const ceci = await mk(a, "recipe", "MERLUZZO con ceci e carote");
    const food = await mk(a, "food", "Mela");
    const theirs = await mk(b, "recipe", "Loro");
    // A rotation (PL-02): two pasti, in his order.
    expect(
      await setBlockWhat(db, a, made.id, {
        items: [
          { id: ceci, quantity: 1 },
          { id: sugo, quantity: 1.5 },
        ],
      }),
    ).toBe("ok");
    expect(
      (await readBlockWhat(db, a, made.id))!.items.map((x) => [x.name, x.quantity]),
    ).toEqual([
      ["MERLUZZO con ceci e carote", "1.00"],
      ["MERLUZZO al sugo", "1.50"],
    ]);
    // Not a type a blocco holds, another's, twice, a zero: refused, nothing changes.
    for (const bad of [
      { items: [{ id: food, quantity: 1 }] },
      { items: [{ id: theirs, quantity: 1 }] },
      {
        items: [
          { id: sugo, quantity: 1 },
          { id: sugo, quantity: 1 },
        ],
      },
      { items: [{ id: sugo, quantity: 0 }] },
      { kind: "nessuno" },
    ])
      expect(await setBlockWhat(db, a, made.id, bad)).toBe("invalid");
    expect(await setBlockWhat(db, b, made.id, { kind: "water" })).toBe("gone");
    expect((await readBlockWhat(db, a, made.id))!.items).toHaveLength(2);
    // A type instead (PL-03: water is an abitudine): the objects go.
    expect(await setBlockWhat(db, a, made.id, { kind: "water" })).toBe("ok");
    expect(await readBlockWhat(db, a, made.id)).toEqual({ items: [], kind: "water" });
    expect((await listBlocks(db, a, false)).map((x) => [x.name, x.area])).toContainEqual([
      "Cena",
      "Cibo",
    ]);
    await act(db, a, "archive", "block", made.id, {});
    expect((await listBlocks(db, a, true)).map((x) => x.name)).toEqual(["Cena"]);
    expect(await listBlocks(db, b, true)).toEqual([]);
  });
});
