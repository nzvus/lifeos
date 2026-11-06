import { describe, expect, it } from "vitest";
import type { Db } from "./db/db";
import { createTestDb } from "./db/test-db";
import { checkDatabase } from "./health";

describe("checkDatabase (DT-34)", () => {
  it("is true when a query runs, false when the database fails", async () => {
    const t = await createTestDb();
    expect(await checkDatabase(t.db as unknown as Db)).toBe(true);
    expect(await checkDatabase(Promise.reject(new Error("no database")))).toBe(false);
  });
});
