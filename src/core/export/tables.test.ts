/** ADR-0052: the export covers every table an account owns — "proprio tutti". */
import { getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import type { Owner } from "../identity/owner";
import { ownedBy } from "../identity/owner";
import { createTestDb, createTestUser } from "../testing/test-db";
import { seedEverything } from "../testing/seed-all";
import { EXCLUDED, EXPORT_TABLES, SCHEMA_TABLES } from "./tables";

describe("export tables", () => {
  it("lists every table with an owner, or excludes it with a reason", () => {
    const listed = new Set(EXPORT_TABLES.map((s) => s.key));
    for (const [name, table] of SCHEMA_TABLES) {
      const owned = Object.values(getTableColumns(table)).some(
        (c) => c.name === "user_id",
      );
      if (owned && !listed.has(name)) expect(EXCLUDED, name).toHaveProperty(name);
    }
    // Tables without an owner column must be excluded on purpose (invites, auth).
    for (const name of SCHEMA_TABLES.keys())
      expect(listed.has(name) || name in EXCLUDED, name).toBe(true);
    for (const name of Object.keys(EXCLUDED))
      expect(SCHEMA_TABLES.has(name), name).toBe(true);
  });

  it("puts every referenced table before the tables that point at it", () => {
    const at = new Map(EXPORT_TABLES.map((s, i) => [s.key, i]));
    for (const s of EXPORT_TABLES)
      for (const p of s.parents)
        if (p.table !== s.key)
          expect(at.get(p.table)!, `${s.key} → ${p.table}`).toBeLessThan(at.get(s.key)!);
  });

  it("knows the references that move with ids", () => {
    const refs = (key: string) =>
      EXPORT_TABLES.find((s) => s.key === key)!.refs.map((r) => `${r.column}→${r.table}`);
    expect(refs("meal_items").sort()).toEqual([
      "ingredientId→ingredients",
      "mealId→meals",
    ]);
    expect(refs("money_categories")).toEqual(["parentId→money_categories"]);
    expect(refs("week_checkin_days")).toEqual([]); // by (user, start day), no id
  });

  describe("the full seed", () => {
    let db: Db;
    let close: () => Promise<void>;
    let alice: Owner;
    beforeEach(async () => {
      ({ db, close } = await createTestDb());
      alice = await createTestUser(db, "alice@example.com");
    });
    afterEach(() => close());

    it("fills every exported table, so the round trips test them all", async () => {
      await seedEverything(db, alice);
      for (const spec of EXPORT_TABLES) {
        const rows = await db.select().from(spec.table).where(ownedBy(spec.table, alice));
        expect(rows.length, getTableConfig(spec.table).name).toBeGreaterThan(0);
      }
    });
  });
});
