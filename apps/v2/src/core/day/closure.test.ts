import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "../db/db";
import { createTestDb, createTestUser } from "../db/test-db";
import { readEnergyRows } from "../energy/read";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";
import { readClosure, setClosure } from "./closure";

describe("closing a day", () => {
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

  it("closes, changes its mind, reopens; only for its owner", async () => {
    expect(await readClosure(db, a, "2026-10-22")).toBeNull();
    await setClosure(db, a, "2026-10-22", "complete");
    await setClosure(db, a, "2026-10-22", "partial");
    expect(await readClosure(db, a, "2026-10-22")).toBe("partial");
    expect(await readClosure(db, b, "2026-10-22")).toBeNull();
    await setClosure(db, b, "2026-10-22", null);
    expect(await readClosure(db, a, "2026-10-22")).toBe("partial");
    await setClosure(db, a, "2026-10-22", null);
    expect(await readClosure(db, a, "2026-10-22")).toBeNull();
  });

  it("E4 reads «manca qualcosa» as partial, not complete", async () => {
    await setClosure(db, a, "2026-10-20", "complete");
    await setClosure(db, a, "2026-10-21", "partial");
    const rows = await readEnergyRows(db, a, "2026-10-19", "2026-10-25");
    expect(rows.closed).toEqual(["2026-10-20"]);
    expect(rows.partial).toEqual(["2026-10-21"]);
  });
});
