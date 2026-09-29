/**
 * core/testing/test-db.ts — a real, throwaway Postgres for tests.
 *
 * PGlite is Postgres compiled to WebAssembly, running inside the test process:
 * no server, no Docker, no network. Each call to `createTestDb()` gives a fresh
 * empty database, then applies THE SAME committed migration files
 * (drizzle/*.sql) that production gets. So every test run also proves the
 * migrations apply cleanly from zero — ADR-0003's pipeline, exercised on
 * every `npm test`.
 *
 * Also provides `createTestUser()` — inserts a user row directly and returns
 * an Owner, bypassing Better Auth (tests of the data layer don't need login).
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Db } from "../db/client";
import * as schema from "../db/schema";
import { ownerFromVerifiedSession, type Owner } from "../identity/owner";

export async function createTestDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const client = new PGlite(); // in-memory database
  const pgliteDb = drizzle(client, { schema });
  await migrate(pgliteDb, { migrationsFolder: "drizzle" });
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
