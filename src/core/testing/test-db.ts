/**
 * core/testing/test-db.ts — a real, throwaway Postgres for tests.
 *
 * PGlite is Postgres compiled to WebAssembly, running inside the test process:
 * no server, no Docker, no network. Each call to `createTestDb()` gives a fresh
 * database with THE SAME committed migration files (drizzle/*.sql) applied
 * that production gets. So every test run also proves the migrations apply
 * cleanly from zero — ADR-0003's pipeline, exercised on every `npm test`.
 *
 * Speed (2026-10-04, CI took 4 minutes): the migrations run ONCE per
 * `npm test` (global-setup.ts writes the migrated data directory to a temp
 * file); every database is a copy of it (loadDataDir). Run alone (no global
 * setup), the first call migrates in this process instead.
 *
 * Also provides `createTestUser()` — inserts a user row directly and returns
 * an Owner, bypassing Better Auth (tests of the data layer don't need login).
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "../db/client";
import * as schema from "../db/schema";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";

/** The migrated empty database of this test process, as a data directory dump. */
let template: Promise<File | Blob> | null = null;

async function migratedTemplate(): Promise<File | Blob> {
  const file = process.env.LIFEOS_TEST_TEMPLATE;
  if (file) return new Blob([readFileSync(file)]);
  const client = new PGlite(); // in-memory database
  await migrate(drizzle(client, { schema }), { migrationsFolder: "drizzle" });
  const dump = await client.dumpDataDir("none");
  await client.close();
  return dump;
}

export async function createTestDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  template ??= migratedTemplate();
  const client = new PGlite({ loadDataDir: await template });
  const pgliteDb = drizzle(client, { schema });
  // PgliteDatabase and NodePgDatabase share the PgDatabase base type (Db).
  return { db: pgliteDb as unknown as Db, close: () => client.close() };
}

export async function createTestUser(db: Db, email: string): Promise<Owner> {
  const [row] = await db
    .insert(schema.user)
    .values({ name: email.split("@")[0]!, email })
    .returning({ id: schema.user.id });
  return ownerFromVerifiedSession(row!.id);
}

/** A valid ingredient input with overridable fields, for brevity in tests. */
export function ingredientFixture(
  overrides: Partial<import("../nutrition/validation").IngredientInput> = {},
) {
  return {
    name: "Oats",
    description: "",
    unit: "g" as const,
    kcal: "372",
    protein: "13.5",
    carbs: "58.7",
    sugars: "0.7",
    fat: "7",
    saturatedFat: "1.3",
    fiber: "10",
    salt: "0.01",
    packagePriceCents: 189,
    packageSize: "500",
    ...overrides,
  };
}
