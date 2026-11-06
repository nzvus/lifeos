import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { exportAll } from "./export";

describe("the export", () => {
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
    await db.insert(s.catalogItems).values([
      { userId: a.id, catalog: "food", name: "Avena" },
      { userId: b.id, catalog: "food", name: "Riso" },
    ]);
  });
  afterAll(() => close());

  it("holds the owner's rows only, every table named", async () => {
    const out = await exportAll(db, a, new Date("2026-10-17T20:00:00Z"));
    expect(out.format).toBe("lifeos-v2-export");
    expect(out.tables.catalog_items.map((r) => (r as { name: string }).name)).toEqual([
      "Avena",
    ]);
    expect(Object.keys(out.tables)).toContain("training_sets");
  });
});
