import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readSettingsCounts } from "./counts";

describe("Impostazioni's counts", () => {
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

  it("live foods, the trash of 30 days, the owner's only", async () => {
    const now = new Date("2026-10-24T12:00:00Z");
    await db.insert(s.catalogItems).values([
      { userId: a.id, catalog: "food", name: "Avena" },
      { userId: a.id, catalog: "food", name: "Vecchio", archivedAt: now },
      { userId: a.id, catalog: "routine", name: "Push" },
    ]);
    await db.insert(s.entries).values([
      {
        userId: a.id,
        kind: "water",
        day: "2026-10-20",
        status: "done",
        deletedAt: new Date("2026-10-21T00:00:00Z"),
      },
      {
        userId: a.id,
        kind: "water",
        day: "2026-08-20",
        status: "done",
        deletedAt: new Date("2026-08-21T00:00:00Z"),
      },
    ]);
    expect(await readSettingsCounts(db, a, now)).toEqual({
      foods: 1,
      kinds: 0,
      trash: 1,
    });
    expect(await readSettingsCounts(db, b, now)).toEqual({
      foods: 0,
      kinds: 0,
      trash: 0,
    });
  });
});
