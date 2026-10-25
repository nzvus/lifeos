import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { createMovement, readCategories, readMovements } from "./index";

describe("the money repository", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  let b: Owner;
  let eat: string;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
    b = ownerFromVerifiedSession(await createTestUser(t.db, "b@example.test"));
    [{ id: eat }] = (await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "money_category", name: "Eating out" })
      .returning({ id: s.catalogItems.id })) as [{ id: string }];
    const [{ id: pay }] = (await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "money_category", name: "Salary" })
      .returning({ id: s.catalogItems.id })) as [{ id: string }];
    await db.insert(s.catalogValues).values([
      { userId: a.id, itemId: eat, field: "kind", text: "expense" },
      { userId: a.id, itemId: pay, field: "kind", text: "income" },
    ]);
  });
  afterAll(() => close());

  it("categories with their kind; a movement written whole, read back, the owner's only", async () => {
    const cats = await readCategories(db, a);
    expect(cats.map((c) => [c.name, c.kind]).sort()).toEqual([
      ["Eating out", "expense"],
      ["Salary", "income"],
    ]);
    await createMovement(db, a, {
      day: "2026-10-04",
      startAt: null,
      cents: -2300,
      categoryId: eat,
      shop: "TAR",
      method: "card",
      note: "Indiano",
    });
    expect(await readMovements(db, a, "2026-10-01", "2026-10-31")).toMatchObject([
      { day: "2026-10-04", cents: -2300, categoryId: eat, shop: "TAR", note: "Indiano" },
    ]);
    expect(await readMovements(db, b, "2026-10-01", "2026-10-31")).toEqual([]);
  });
});
