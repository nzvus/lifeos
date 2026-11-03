import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { loadDay } from "../day";
import { checkEntry, createEntry } from "../entries";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { kindRegistry } from "../kinds";
import { readFoodChoices } from "./catalog";
import { checkMealLines } from "./meal";
import { centsPer100, entryCost } from "./cost";

describe("a meal keeps the price of its day (dossiers/costs.md §4, test 5)", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  let format: string;
  let milk: string;

  const item = async (owner: Owner, catalog: string, name: string, parentId?: string) =>
    (
      (await db
        .insert(s.catalogItems)
        .values({ userId: owner.id, catalog, name, parentId: parentId ?? null })
        .returning({ id: s.catalogItems.id })) as [{ id: string }]
    )[0].id;

  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    milk = await item(a, "food", "Latte scremato proteico");
    await db
      .insert(s.catalogValues)
      .values({ userId: a.id, itemId: milk, field: "kcal", num: "53" });
    const product = await item(a, "product", "Esselunga", milk);
    format = await item(a, "format", "1 l", product);
    await db.insert(s.priceObservations).values([
      {
        userId: a.id,
        formatId: format,
        shop: "Esselunga",
        day: "2026-10-01",
        cents: 179,
        packageQty: "1000",
        unit: "ml",
        source: "manual",
      },
      {
        userId: a.id,
        formatId: format,
        shop: "Esselunga",
        day: "2026-11-20",
        cents: 249,
        packageQty: "1000",
        unit: "ml",
        source: "manual",
      },
    ]);
  });
  afterAll(() => close());

  it("offers the food and its product with the price per 100 of the day, only to its owner", async () => {
    const choices = await readFoodChoices(db, a, "2026-11-03");
    expect(choices.map((c) => [c.key.includes(":"), c.per100["cents"]])).toEqual([
      [false, "17.90"],
      [true, "17.90"],
    ]);
    expect(await readFoodChoices(db, b, "2026-11-03")).toEqual([]);
  });

  it("snapshots it on the line: a later price leaves the meal's cost", async () => {
    const choices = await readFoodChoices(db, a, "2026-11-03");
    const lines = checkMealLines(
      [{ key: choices[0]!.key, quantity: "250" }],
      new Map(choices.map((c) => [c.key, c])),
    );
    const entry = checkEntry(
      kindRegistry().get("meal"),
      {
        day: "2026-11-03",
        status: "done",
        startMin: 8 * 60,
        endMin: null,
        values: { role: "breakfast" },
        note: "",
      },
      { timeZone: "Europe/Rome", boundaryMin: 240 },
    );
    if (!lines.ok || !entry.ok) throw new Error("expected a valid meal");
    const id = await createEntry(db, a, { ...entry.entry, lines: lines.lines });
    const later = await readFoodChoices(db, a, "2026-11-25");
    expect(later[0]!.per100["cents"]).toBe("24.90");
    const meal = (await loadDay(db, a, "2026-11-03")).timed.find((i) => i.id === id)!;
    expect(Number(centsPer100(meal.lines![0]!.values))).toBe(17.9);
    expect(Number(entryCost(meal.lines!).cents)).toBeCloseTo(44.75, 5);
  });

  it("fills the lines logged in v2 without a price, once, leaving v1's (migration 0005)", async () => {
    const [{ id: meal }] = (await db
      .insert(s.entries)
      .values({ userId: a.id, kind: "meal", day: "2026-10-25", status: "done" })
      .returning({ id: s.entries.id })) as [{ id: string }];
    const [v2, v1] = (await db
      .insert(s.entryLines)
      .values([
        {
          userId: a.id,
          entryId: meal,
          position: 0,
          itemId: milk,
          name: "Latte",
          quantity: "200",
          unit: "ml",
        },
        {
          userId: a.id,
          entryId: meal,
          position: 1,
          itemId: milk,
          name: "Latte",
          quantity: "100",
          unit: "ml",
        },
      ])
      .returning({ id: s.entryLines.id })) as [{ id: string }, { id: string }];
    await db.insert(s.entryLineValues).values([
      { userId: a.id, lineId: v1.id, field: "packagePriceCents", num: "150" },
      { userId: a.id, lineId: v1.id, field: "packageSize", num: "1000" },
    ]);
    const repair = readFileSync(
      join(__dirname, "../../../drizzle/0005_data_repair_cost_snapshot.sql"),
      "utf8",
    );
    await db.execute(sql.raw(repair));
    await db.execute(sql.raw(repair));
    const rows = await db
      .select({
        line: s.entryLineValues.lineId,
        field: s.entryLineValues.field,
        num: s.entryLineValues.num,
      })
      .from(s.entryLineValues)
      .where(eq(s.entryLineValues.field, "cents"));
    expect(rows.filter((r) => r.line === v1.id)).toEqual([]);
    expect(rows.filter((r) => r.line === v2.id).map((r) => Number(r.num))).toEqual([
      17.9,
    ]);
  });
});
