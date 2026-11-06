/**
 * core/db/client.ts — the two ways v2 opens a database (ADR-0057). Making
 * one is the app's composition root (app/_server/runtime.ts) or a local
 * script; repositories only receive a `Db`.
 *
 *   - `createDb(url)`: Postgres over a pool (Neon's branch `v2`). Never
 *     migrated here: migrations reach a shared database only through the
 *     human-triggered job (ADR-0003/0004).
 *   - `createLocalDb(dir)`: PGlite in a folder on this machine, for running
 *     the app with no database server (`V2_PGLITE_DIR`). It is nobody's but
 *     this machine's, so it applies the committed migrations itself.
 */
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { Pool } from "pg";
import type { Db } from "./db";
import * as schema from "./schema";

/** max 10: Neon's pooled endpoint multiplexes the small pools of each function (v1). */
export function createDb(connectionString: string): Db {
  return drizzlePg(new Pool({ connectionString, max: 10 }), { schema }) as unknown as Db;
}

export async function createLocalDb(dir: string): Promise<Db> {
  const db = drizzlePglite(new PGlite(dir), { schema });
  await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
  return db as unknown as Db;
}
