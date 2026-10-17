/**
 * core/db/test-db.ts — a real, throwaway Postgres for v2's tests (as v1's
 * core/testing/test-db.ts). PGlite runs Postgres inside the test process;
 * every database gets the committed migrations (apps/v2/drizzle/*.sql) from
 * zero, so every `npm test` proves they apply. Migrated once per process,
 * then copied.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";

export type TestDb = PgliteDatabase<typeof schema>;

let template: Promise<File | Blob> | null = null;

async function migrated(): Promise<File | Blob> {
  const client = new PGlite();
  await migrate(drizzle(client, { schema }), { migrationsFolder: "drizzle" });
  const dump = await client.dumpDataDir("none");
  await client.close();
  return dump;
}

export async function createTestDb(): Promise<{
  db: TestDb;
  client: PGlite;
  close: () => Promise<void>;
}> {
  template ??= migrated();
  const client = new PGlite({ loadDataDir: await template });
  return { db: drizzle(client, { schema }), client, close: () => client.close() };
}

/** A user row, inserted directly (no login in data tests); returns its id. */
export async function createTestUser(db: TestDb, email: string): Promise<string> {
  const [row] = await db
    .insert(schema.user)
    .values({ name: email.split("@")[0]!, email })
    .returning({ id: schema.user.id });
  return row!.id;
}
