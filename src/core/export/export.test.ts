/** Tests for the user-facing export: complete for me, nothing of anyone else, no secrets (ADR-0052). */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import { account } from "../db/schema";
import type { Owner } from "../identity/owner";
import { createTestDb, createTestUser } from "../testing/test-db";
import { seedEverything } from "../testing/seed-all";
import { EXPORT_FORMAT, EXPORT_VERSION, exportUserData } from "./export";
import { EXPORT_TABLES } from "./tables";

let db: Db;
let close: () => Promise<void>;
let alice: Owner;
let bob: Owner;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
  alice = await createTestUser(db, "alice@example.com");
  bob = await createTestUser(db, "bob@example.com");
});
afterEach(() => close());

describe("exportUserData", () => {
  it("has every table, my rows only, the trash included, and no secret", async () => {
    await seedEverything(db, alice);
    await seedEverything(db, bob);
    await db.insert(account).values({
      accountId: "a",
      providerId: "credential",
      userId: alice.id,
      password: "HASH-SHOULD-NOT-LEAK",
    });

    const data = await exportUserData(db, alice, new Date("2026-10-15T10:00:00Z"));
    const text = JSON.stringify(data);

    expect(data.format).toBe(EXPORT_FORMAT);
    expect(data.version).toBe(EXPORT_VERSION);
    expect(data.exportedAt).toBe("2026-10-15T10:00:00.000Z");
    expect(data.account?.email).toBe("alice@example.com");
    expect(Object.keys(data.tables).sort()).toEqual(
      EXPORT_TABLES.map((s) => s.key).sort(),
    );
    // seedEverything writes the same rows for both: same counts = only mine.
    for (const [key, rows] of Object.entries(data.tables))
      expect(rows.length, key).toBeGreaterThan(0);
    const bobs = await exportUserData(db, bob);
    for (const key of Object.keys(data.tables))
      expect(data.tables[key]!.length, key).toBe(bobs.tables[key]!.length);
    const ids = (e: typeof data) => new Set(e.tables.ingredients!.map((r) => r.id));
    for (const id of ids(bobs)) expect(ids(data).has(id)).toBe(false);

    expect(text).not.toContain(bob.id);
    expect(text).not.toContain("userId");
    expect(text).not.toContain("HASH-SHOULD-NOT-LEAK");
    expect(text).not.toContain("SECRET"); // the assistant's key (ADR-0018)
    expect(data.tables.user_settings![0]).toMatchObject({ assistantKeyLast4: "ab12" });
    // The trash travels too (it is still my data for 30 days).
    expect(data.tables.ingredients!.map((r) => r.name)).toContain("Old flour");
    // Stored values, not display values.
    expect(data.tables.ingredients!.find((r) => r.name === "Oats")).toMatchObject({
      protein: "16.900",
      packagePriceCents: 199,
    });
  });
});
