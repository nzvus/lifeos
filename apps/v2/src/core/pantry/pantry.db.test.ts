import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { logCount, logPurchase, readPantry } from "./index";

describe("the Dispensa from purchases, counts and logged meals", () => {
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

  const meal = async (o: Owner, day: string, itemId: string, qty: string, servings?: string) => {
    const [e] = await db
      .insert(s.entries)
      .values({
        userId: o.id,
        kind: "meal",
        day,
        status: "done",
        startAt: new Date(day + "T08:00:00Z"),
      })
      .returning({ id: s.entries.id });
    await db.insert(s.entryLines).values({
      userId: o.id,
      entryId: e!.id,
      position: 0,
      itemId,
      name: "Latte proteico",
      quantity: qty,
      unit: "ml",
    });
    if (servings)
      await db
        .insert(s.entryValues)
        .values({ userId: o.id, entryId: e!.id, field: "servings", num: servings });
  };

  it("a format's purchase in its food, the meals out, a count resetting; the owner's only", async () => {
    const [milk] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "food", name: "Latte proteico" })
      .returning({ id: s.catalogItems.id });
    await db
      .insert(s.catalogValues)
      .values({ userId: a.id, itemId: milk!.id, field: "unit", text: "ml" });
    const [lidl] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "product", name: "Lidl", parentId: milk!.id })
      .returning({ id: s.catalogItems.id });
    const [litre] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "format", name: "1000 ml", parentId: lidl!.id })
      .returning({ id: s.catalogItems.id });
    // Eaten but never bought: not in the Dispensa.
    const [oats] = await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "food", name: "Avena" })
      .returning({ id: s.catalogItems.id });
    await meal(a, "2026-10-20", oats!.id, "50");

    await logPurchase(db, a, {
      itemId: litre!.id,
      day: "2026-10-20",
      at: new Date("2026-10-20T07:00:00Z"),
      quantity: "2000",
      packages: "2",
      priceCents: 398,
      shop: "Lidl",
    });
    await meal(a, "2026-10-20", milk!.id, "100");
    await meal(a, "2026-10-21", milk!.id, "200", "2");
    await meal(a, "2026-10-22", milk!.id, "100");
    await meal(a, "2026-10-23", milk!.id, "100");

    const now = new Date("2026-10-23T20:00:00Z");
    const [p] = await readPantry(db, a, "2026-10-23", now);
    expect(p).toMatchObject({
      foodId: milk!.id,
      name: "Latte proteico",
      unit: "ml",
      stock: { left: "1300", dailyUse: "175", daysLeft: 7 },
      // 7 days left, the shop every 7 + 2 of margin: already on the list (§5).
      toBuy: true,
      last: { itemId: litre!.id, packages: "2", priceCents: 398, shop: "Lidl" },
    });

    await logCount(db, a, {
      foodId: milk!.id,
      day: "2026-10-23",
      at: new Date("2026-10-23T19:00:00Z"),
      quantity: "300",
    });
    const [q] = await readPantry(db, a, "2026-10-23", now);
    expect(q!.stock.left).toBe("300");
    expect(q!.stock.daysLeft).toBe(1);

    expect(await readPantry(db, b, "2026-10-23", now)).toEqual([]);
    await expect(
      logCount(db, b, { foodId: milk!.id, day: "2026-10-23", at: now, quantity: "1" }),
    ).rejects.toThrow();
  });
});
