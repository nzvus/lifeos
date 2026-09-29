/**
 * core/db/client.ts — how the app gets a database connection.
 *
 * ADR-0003: this folder is the ONLY code that holds a connection. Routes,
 * server actions and components never import `pg` or run SQL; they call
 * repository functions (core/nutrition/repositories/*), which receive a `Db`.
 *
 * Why a factory instead of a global: tests pass a different database (PGlite,
 * in-memory Postgres — core/testing/test-db.ts) to the very same repository
 * code. The single real instance for the running app is created once in
 * src/app/_server/runtime.ts, which reads DATABASE_URL.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

export type Schema = typeof schema;

/**
 * The type every repository accepts. It is the common base of the node-postgres
 * database (production) and the PGlite database (tests), so both fit.
 */
export type Db = PgDatabase<PgQueryResultHKT, Schema>;

/**
 * Creates a Drizzle database on a connection pool.
 *
 * `max: 5`: on Vercel each function instance gets its own pool; Neon's pooled
 * endpoint (hostname containing "-pooler") multiplexes them, so small pools
 * are right. Use the pooled URL for the app, the direct one for pg_dump.
 */
export function createDb(connectionString: string): Db {
  return openDb(connectionString).db;
}

/**
 * Same, plus `close()` to end the pool. A long-running server never closes
 * it; a command-line script must, or Node keeps waiting on open connections
 * and the script never exits (scripts/import-fitforge.ts).
 */
export function openDb(connectionString: string): { db: Db; close: () => Promise<void> } {
  const pool = new Pool({ connectionString, max: 5 });
  return { db: drizzle(pool, { schema }), close: () => pool.end() };
}
