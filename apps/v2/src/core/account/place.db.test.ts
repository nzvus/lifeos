import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import type { Db } from "../db/db";
import * as s from "../db/schema";
import { createTestDb, createTestUser } from "../db/test-db";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readPlace, savePlace } from "./place";

describe("the person's city", () => {
  let db: Db;
  let close: () => Promise<void>;
  let a: Owner;
  beforeAll(async () => {
    const t = await createTestDb();
    db = t.db as unknown as Db;
    close = t.close;
    a = ownerFromVerifiedSession(await createTestUser(t.db, "a@example.test"));
  });
  afterAll(() => close());

  it("is kept in prefs next to what is there, and taken out", async () => {
    expect(await readPlace(db, a)).toBeNull();
    await savePlace(db, a, { name: "Roma", latitude: 41.9, longitude: 12.5 });
    await db
      .update(s.settings)
      .set({
        prefs: {
          lunchFrom: 690,
          place: { name: "Roma", latitude: 41.9, longitude: 12.5 },
        },
      })
      .where(eq(s.settings.userId, a.id));
    await savePlace(db, a, { name: "Bologna", latitude: 44.49, longitude: 11.34 });
    expect(await readPlace(db, a)).toEqual({
      name: "Bologna",
      latitude: 44.49,
      longitude: 11.34,
    });
    const [row] = await db
      .select({ p: s.settings.prefs })
      .from(s.settings)
      .where(eq(s.settings.userId, a.id));
    expect(row!.p["lunchFrom"]).toBe(690);
    await savePlace(db, a, null);
    expect(await readPlace(db, a)).toBeNull();
  });
});
