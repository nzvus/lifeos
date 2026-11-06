/**
 * v2's schema on a real Postgres (PGlite) with the committed migrations
 * (ADR-0057): the database itself keeps isolation, exactness and shape.
 */
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as s from "./schema";
import { createTestDb, createTestUser, type TestDb } from "./test-db";

let db: TestDb;
let close: () => Promise<void>;
let a: string;
let b: string;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  a = await createTestUser(db, "a@example.test");
  b = await createTestUser(db, "b@example.test");
});
afterAll(() => close());

const food = async (
  userId: string,
  name: string,
  parentId?: string,
  catalog = "food",
) => {
  const [row] = await db
    .insert(s.catalogItems)
    .values({ userId, catalog, name, ...(parentId ? { parentId } : {}) })
    .returning({ id: s.catalogItems.id });
  return row!.id;
};
const entry = async (
  userId: string,
  kind = "meal",
  extra: Partial<typeof s.entries.$inferInsert> = {},
) => {
  const [row] = await db
    .insert(s.entries)
    .values({ userId, kind, day: "2026-10-17", status: "done", ...extra })
    .returning({ id: s.entries.id });
  return row!.id;
};

describe("the migrations", () => {
  it("apply from zero and create every table of schema.md", async () => {
    const rows = await db.execute<{ n: number }>(
      sql`select count(*)::int as n from information_schema.tables where table_schema = 'public'`,
    );
    // 6 auth + settings + 5 definitions + 10 facts + 8 plans
    expect(rows.rows[0]!.n).toBe(30);
  });
});

describe("isolation: another user's rows cannot be referenced", () => {
  it("a value, a line, a part, a parent, a link", async () => {
    const mine = await food(a, "Avena");
    const theirs = await entry(b);
    await expect(
      db
        .insert(s.entryValues)
        .values({ userId: b, entryId: theirs, field: "food", refItemId: mine }),
    ).rejects.toThrow();
    await expect(
      db.insert(s.entryLines).values({
        userId: b,
        entryId: theirs,
        position: 0,
        itemId: mine,
        name: "x",
        quantity: "50",
        unit: "g",
      }),
    ).rejects.toThrow();
    const recipe = await food(b, "Porridge", undefined, "recipe");
    await expect(
      db
        .insert(s.catalogParts)
        .values({ userId: b, itemId: recipe, position: 0, partItemId: mine }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(s.catalogItems)
        .values({ userId: b, catalog: "product", name: "Brand", parentId: mine }),
    ).rejects.toThrow();
    const myEntry = await entry(a);
    await expect(
      db
        .insert(s.entryLinks)
        .values({ userId: b, fromId: theirs, toId: myEntry, relation: "related" }),
    ).rejects.toThrow();
    await expect(
      db.insert(s.entries).values({
        userId: b,
        kind: "set",
        day: "2026-10-17",
        status: "done",
        parentId: myEntry,
      }),
    ).rejects.toThrow();
  });
  it("the same rows within one user are fine", async () => {
    const oats = await food(a, "Avena integrale");
    const e = await entry(a);
    await db
      .insert(s.entryValues)
      .values({ userId: a, entryId: e, field: "food", refItemId: oats });
    const [line] = await db
      .insert(s.entryLines)
      .values({
        userId: a,
        entryId: e,
        position: 0,
        itemId: oats,
        name: "Avena integrale",
        quantity: "50",
        unit: "g",
      })
      .returning({ id: s.entryLines.id });
    await db
      .insert(s.entryLineValues)
      .values({ userId: a, lineId: line!.id, field: "kcal", num: "372" });
  });
});

describe("exact numbers and shapes", () => {
  it("numeric comes back as an exact string", async () => {
    const e = await entry(a, "money");
    await db
      .insert(s.entryValues)
      .values({ userId: a, entryId: e, field: "amount", num: "18.59" });
    const [v] = await db.select().from(s.entryValues).where(eq(s.entryValues.entryId, e));
    expect(v!.num).toBe("18.5900");
  });
  it("a value holds exactly one of num, text, bool, ref", async () => {
    const e = await entry(a);
    await expect(
      db.insert(s.entryValues).values({ userId: a, entryId: e, field: "x" }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(s.entryValues)
        .values({ userId: a, entryId: e, field: "y", num: "1", text: "1" }),
    ).rejects.toThrow();
  });
  it("an interval ends after it starts; a status is one of three", async () => {
    const at = new Date("2026-10-17T08:00:00Z");
    await expect(entry(a, "sleep", { startAt: at, endAt: at })).rejects.toThrow();
    await expect(entry(a, "sleep", { endAt: at })).rejects.toThrow();
    await expect(entry(a, "meal", { status: "eaten" as "done" })).rejects.toThrow();
  });
  it("one live name per catalog and parent; a deleted one frees it", async () => {
    const pasta = await food(a, "Pasta");
    await expect(food(a, "pasta")).rejects.toThrow();
    const p1 = await food(a, "De Cecco", pasta, "product");
    const p2 = await food(a, "Barilla", pasta, "product");
    await food(a, "500 g", p1, "format");
    await food(a, "500 g", p2, "format"); // another product: fine
    await db
      .update(s.catalogItems)
      .set({ deletedAt: new Date() })
      .where(eq(s.catalogItems.id, pasta));
    await food(a, "Pasta");
  });
  it("a block of its own needs a kind and a when; only a difference can remove", async () => {
    const [t] = await db
      .insert(s.templates)
      .values({ userId: a, scope: "day", name: "Lavoro" })
      .returning({ id: s.templates.id });
    await expect(
      db.insert(s.templateBlocks).values({ userId: a, templateId: t!.id, position: 0 }),
    ).rejects.toThrow();
    await expect(
      db.insert(s.templateBlocks).values({
        userId: a,
        templateId: t!.id,
        position: 0,
        kind: "meal",
        when: "absolute",
        removed: true,
      }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(s.templates)
        .values({ userId: a, scope: "week", name: "X", extendsId: t!.id })
        .returning(),
    ).resolves.toHaveLength(1);
  });
  it("a food in a recipe cannot be hard-deleted (the purge removes parts first)", async () => {
    const egg = await food(a, "Uovo");
    const recipe = await food(a, "Frittata", undefined, "recipe");
    await db.insert(s.catalogParts).values({
      userId: a,
      itemId: recipe,
      position: 0,
      partItemId: egg,
      quantity: "120",
      unit: "g",
    });
    await expect(
      db.delete(s.catalogItems).where(eq(s.catalogItems.id, egg)),
    ).rejects.toThrow();
  });
});

describe("deleting a user", () => {
  it("removes every row of theirs, through every reference, and nobody else's", async () => {
    const c = await createTestUser(db, "c@example.test");
    const pasta = await food(c, "Pasta");
    const product = await food(c, "Brand", pasta, "product");
    const format = await food(c, "500 g", product, "format");
    const recipe = await food(c, "Pasta al sugo", undefined, "recipe");
    await db
      .insert(s.catalogParts)
      .values({ userId: c, itemId: recipe, position: 0, partItemId: pasta });
    await db
      .insert(s.catalogValues)
      .values({ userId: c, itemId: recipe, field: "tag", refItemId: pasta });
    await db.insert(s.priceObservations).values({
      userId: c,
      formatId: format,
      day: "2026-10-17",
      cents: 129,
      packageQty: "500",
      unit: "g",
      source: "manual",
    });
    const session = await entry(c, "session", { itemId: recipe });
    const ex = await entry(c, "session_exercise", { parentId: session, itemId: pasta });
    await db
      .insert(s.trainingSets)
      .values({ userId: c, entryId: ex, position: 0, reps: 8, loadKg: "60" });
    const [t] = await db
      .insert(s.templates)
      .values({ userId: c, scope: "day", name: "Base" })
      .returning({ id: s.templates.id });
    const [t2] = await db
      .insert(s.templates)
      .values({ userId: c, scope: "day", name: "Derived", extendsId: t!.id })
      .returning({ id: s.templates.id });
    const [blk] = await db
      .insert(s.templateBlocks)
      .values({
        userId: c,
        templateId: t!.id,
        position: 0,
        kind: "meal",
        when: "absolute",
        atMin: 480,
        itemId: recipe,
      })
      .returning({ id: s.templateBlocks.id });
    await db.insert(s.templateBlocks).values({
      userId: c,
      templateId: t2!.id,
      position: 0,
      baseBlockId: blk!.id,
      removed: true,
    });
    await db
      .insert(s.decisions)
      .values({ userId: c, kind: "day_closed", day: "2026-10-17" });

    await db.delete(s.user).where(eq(s.user.id, c));
    for (const table of [
      s.catalogItems,
      s.entries,
      s.templates,
      s.trainingSets,
      s.decisions,
      s.priceObservations,
    ]) {
      const rows = await db.select().from(table).where(eq(table.userId, c));
      expect(rows).toEqual([]);
    }
    expect(
      (await db.select().from(s.catalogItems).where(eq(s.catalogItems.userId, a))).length,
    ).toBeGreaterThan(0);
  });
});
