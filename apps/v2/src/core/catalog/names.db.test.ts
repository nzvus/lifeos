import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readCatalogNames } from "./names";

describe("⊕'s search names", () => {
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
    const [{ id: oats }] = (await db
      .insert(s.catalogItems)
      .values({ userId: a.id, catalog: "food", name: "Avena" })
      .returning({ id: s.catalogItems.id })) as [{ id: string }];
    await db.insert(s.catalogItems).values([
      { userId: a.id, catalog: "product", name: "Lidl", parentId: oats },
      { userId: a.id, catalog: "recipe", name: "Porridge" },
      { userId: a.id, catalog: "routine", name: "Push" },
      { userId: a.id, catalog: "exercise", name: "Panca piana" },
      { userId: a.id, catalog: "food", name: "Vecchio", archivedAt: new Date() },
      { userId: b.id, catalog: "food", name: "Riso" },
    ]);
  });
  afterAll(() => close());

  it("foods, saved meals and routines of the owner, live, by name", async () => {
    expect((await readCatalogNames(db, a)).map((x) => [x.catalog, x.name])).toEqual([
      ["food", "Avena"],
      ["recipe", "Porridge"],
      ["routine", "Push"],
    ]);
  });
});
